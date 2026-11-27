/**
 * Testa a migração com um Firestore falso em memória, usando dados no
 * mesmo formato dos que existem hoje no banco.
 * Rodar: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import { migrate } from "../scripts/lib/migracao.mjs";

/** Firestore mínimo em memória: caminhos → dados */
function fakeDb(initial) {
  const store = new Map(Object.entries(initial));
  let autoId = 0;
  const docRef = (path) => ({
    path,
    id: path.split("/").pop(),
    collection: (name) => colRef(`${path}/${name}`),
  });
  const colRef = (path) => ({
    doc: (id) => docRef(`${path}/${id ?? `auto${++autoId}`}`),
    async get() {
      const depth = path.split("/").length + 1;
      const docs = [...store.keys()]
        .filter((k) => k.startsWith(`${path}/`) && k.split("/").length === depth)
        .map((k) => ({ id: k.split("/").pop(), ref: docRef(k), data: () => ({ ...store.get(k) }) }));
      return { docs };
    },
  });
  return {
    store,
    collection: (name) => colRef(name),
    batch() {
      const ops = [];
      return {
        set: (ref, data) => ops.push(() => store.set(ref.path, data)),
        delete: (ref) => ops.push(() => store.delete(ref.path)),
        commit: async () => ops.forEach((op) => op()),
      };
    },
  };
}

const UID = "J5TB8P5Azna5druDZ08M6SBj5kW2";
const created = Timestamp.fromDate(new Date("2026-06-01T17:55:42Z"));

function seed() {
  return fakeDb({
    [`users/${UID}`]: {
      fullName: "adm_unirios1",
      email: "adm_unirios1@gmail.com",
      phone: "",
      avatarInitials: "A",
      photoURL: "data:image/jpeg;base64,AAAA",
    },
    "users/semDados": { fullName: "Maria Souza", email: "Maria@Ex.com" },
    "transactions/tx1": {
      amount: 62,
      category: "shopping",
      createdAt: created,
      date: "2026-03-09",
      description: "Compra dos remédios do meu avô",
      history: [{ action: "created", date: "2026-06-01T17:55:43.023Z" }],
      name: "Remédio",
      paymentMethod: "digitalWallet",
      type: "expense",
      updatedAt: "2026-06-01T17:55:43.023Z",
      userId: UID,
    },
    // formato da antiga AddExpenseScreen: valor negativo, sem tipo e sem nome
    "transactions/tx2": {
      userId: UID,
      amount: -35.5,
      description: "Padaria",
      category: "food",
      date: "2026-05-02",
      createdAt: created,
    },
    "transactions/orfa": { amount: 10, userId: "naoExiste", name: "x", type: "income" },
    "goals/g1": {
      category: "savings",
      color: "#5b6bf5",
      createdAt: created,
      currentAmount: 25,
      deadline: "2026-08-30",
      history: [{ action: "created", date: "2026-06-01T22:16:06.511Z" }],
      icon: "🏦",
      name: "teste",
      status: "closed",
      targetAmount: 50,
      updatedAt: "2026-06-01T22:16:39.310Z",
      userId: UID,
    },
    [`preferences/${UID}`]: { notifications: { income: true }, security: { twoFactorEnabled: false } },
    [`cards/${UID}`]: {
      cards: [{ id: "c1", name: "Nubank", number: "4111 1111 1111 1234", cvv: "123", expiry: "12/28", holderName: "Victor" }],
    },
  });
}

const quiet = { log: () => {}, table: () => {} };

test("simulação (sem --apply) não grava nada", async () => {
  const db = seed();
  const before = JSON.stringify([...db.store]);
  const { plan, orphans } = await migrate({ db, authUsers: new Map(), ...quiet });
  assert.equal(JSON.stringify([...db.store]), before);
  assert.equal(plan.get(UID).tx.length, 2);
  assert.deepEqual(orphans, ["transactions/orfa (userId: naoExiste)"]);
});

test("--apply organiza tudo dentro de users/{uid}", async () => {
  const db = seed();
  await migrate({ db, authUsers: new Map(), apply: true, ...quiet });
  const s = db.store;

  // perfil limpo, sem a foto base64
  const profile = s.get(`users/${UID}`);
  assert.equal(profile.fullName, "adm_unirios1");
  assert.equal(profile.photoURL, undefined);
  assert.ok(profile.createdAt instanceof Timestamp);
  assert.ok(profile.updatedAt instanceof Timestamp);
  assert.equal(s.get(`users/${UID}/settings/profilePhoto`).dataUrl, "data:image/jpeg;base64,AAAA");

  // transação mantém o mesmo id, perde userId, updatedAt vira Timestamp
  const tx1 = s.get(`users/${UID}/transactions/tx1`);
  assert.equal(tx1.userId, undefined);
  assert.equal(tx1.name, "Remédio");
  assert.ok(tx1.updatedAt instanceof Timestamp);
  assert.equal(tx1.createdAt, created);

  // formato legado corrigido
  const tx2 = s.get(`users/${UID}/transactions/tx2`);
  assert.equal(tx2.amount, 35.5);
  assert.equal(tx2.type, "expense");
  assert.equal(tx2.name, "Padaria");
  assert.equal(tx2.history[0].action, "created");

  assert.equal(s.get(`users/${UID}/goals/g1`).status, "closed");
  assert.deepEqual(Object.keys(s.get(`users/${UID}/settings/preferences`)).sort(), [
    "notifications",
    "security",
    "updatedAt",
  ]);

  // cartão: só os 4 últimos dígitos, CVV descartado
  const card = s.get(`users/${UID}/cards/c1`);
  assert.equal(card.lastDigits, "1234");
  assert.equal(card.number, undefined);
  assert.equal(card.cvv, undefined);
  assert.equal(card.brand, "other");

  // e-mail normalizado no perfil sem dados
  assert.equal(s.get("users/semDados").email, "maria@ex.com");

  // sem --delete-old as coleções antigas continuam
  assert.ok(s.has("transactions/tx1"));
});

test("--apply --delete-old apaga as antigas, mas mantém as órfãs", async () => {
  const db = seed();
  const { deleted } = await migrate({ db, authUsers: new Map(), apply: true, deleteOld: true, ...quiet });
  const roots = [...db.store.keys()].filter((k) => !k.startsWith("users/"));
  assert.deepEqual(roots, ["transactions/orfa"]);
  assert.equal(deleted, 5); // tx1, tx2, g1, preferences, cards
});

test("rodar duas vezes dá o mesmo resultado", async () => {
  const db = seed();
  await migrate({ db, authUsers: new Map(), apply: true, ...quiet });
  const first = db.store.get(`users/${UID}/transactions/tx1`);
  await migrate({ db, authUsers: new Map(), apply: true, deleteOld: true, ...quiet });
  assert.deepEqual(db.store.get(`users/${UID}/transactions/tx1`), first);
  // a foto continua existindo mesmo com o perfil reescrito na segunda vez
  assert.ok(db.store.has(`users/${UID}/settings/profilePhoto`));
});

test("dono que só existe no Authentication ganha perfil", async () => {
  const db = fakeDb({
    "transactions/t": { userId: "soAuth", amount: 5, name: "Café", type: "expense", category: "food", date: "2026-01-01" },
  });
  const authUsers = new Map([
    ["soAuth", { uid: "soAuth", email: "Joao@Ex.com", displayName: "João Lima", metadata: { creationTime: "2026-01-01T00:00:00Z" } }],
  ]);
  await migrate({ db, authUsers, apply: true, ...quiet });
  const profile = db.store.get("users/soAuth");
  assert.equal(profile.fullName, "João Lima");
  assert.equal(profile.email, "joao@ex.com");
  assert.equal(profile.avatarInitials, "JL");
  assert.ok(db.store.has("users/soAuth/transactions/t"));
});
