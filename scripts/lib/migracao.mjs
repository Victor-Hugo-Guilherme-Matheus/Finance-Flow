/**
 * Lógica da migração (separada do CLI para poder ser testada).
 * Veja scripts/migrar-banco.mjs para a descrição completa.
 */
import { Timestamp } from "firebase-admin/firestore";

// ---------- Normalização ----------

const TX_TYPES = ["income", "expense", "transfer"];
const GOAL_STATUS = ["active", "completed", "closed"];
const CARD_BRANDS = ["visa", "mastercard", "elo", "amex", "other"];

function toTimestamp(value, fallback) {
  if (value instanceof Timestamp) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return Timestamp.fromDate(d);
  }
  if (value && typeof value.toDate === "function") return Timestamp.fromDate(value.toDate());
  return fallback ?? Timestamp.now();
}

function toIsoDay(value, fallbackTs) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = (value instanceof Timestamp ? value : fallbackTs).toDate();
  return d.toISOString().slice(0, 10);
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

function clean(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

function normalizeHistory(history, createdAt) {
  if (Array.isArray(history) && history.length > 0) {
    return history
      .filter((h) => h && typeof h === "object")
      .map((h) =>
        clean({
          date: typeof h.date === "string" ? h.date : toTimestamp(h.date, createdAt).toDate().toISOString(),
          action: str(h.action, 30) ?? "updated",
          amount: typeof h.amount === "number" ? h.amount : undefined,
        })
      );
  }
  return [{ date: createdAt.toDate().toISOString(), action: "created" }];
}

export function normalizeTransaction(d) {
  const createdAt = toTimestamp(d.createdAt);
  const rawAmount = Number(d.amount) || 0;
  const type = TX_TYPES.includes(d.type) ? d.type : "expense";
  return clean({
    name: str(d.name, 100) || str(d.description, 100) || "Sem nome",
    description: str(d.description, 300),
    amount: Math.abs(rawAmount),
    type,
    category: str(d.category, 40) || "other",
    date: toIsoDay(d.date, createdAt),
    paymentMethod: str(d.paymentMethod, 40),
    notes: str(d.notes, 1000),
    history: normalizeHistory(d.history, createdAt),
    createdAt,
    updatedAt: toTimestamp(d.updatedAt, createdAt),
  });
}

export function normalizeGoal(d) {
  const createdAt = toTimestamp(d.createdAt);
  return clean({
    name: str(d.name, 100) || "Meta",
    targetAmount: Math.abs(Number(d.targetAmount)) || 1,
    currentAmount: Math.max(0, Number(d.currentAmount) || 0),
    deadline: toIsoDay(d.deadline, createdAt),
    category: str(d.category, 40) || "savings",
    icon: str(d.icon, 10),
    color: str(d.color, 20),
    status: GOAL_STATUS.includes(d.status) ? d.status : "active",
    history: normalizeHistory(d.history, createdAt),
    createdAt,
    updatedAt: toTimestamp(d.updatedAt, createdAt),
  });
}

export function normalizeCard(c) {
  const legacy = typeof c.number === "string" ? c.number.replace(/\D/g, "") : "";
  const lastDigits = (typeof c.lastDigits === "string" ? c.lastDigits.replace(/\D/g, "") : legacy).slice(-4);
  return {
    name: str(c.name, 60) || "Cartão",
    lastDigits: /^\d{4}$/.test(lastDigits) ? lastDigits : "0000",
    expiry: /^\d{2}\/\d{2}$/.test(c.expiry ?? "") ? c.expiry : "01/30",
    brand: CARD_BRANDS.includes(c.brand) ? c.brand : "other",
    holderName: str(c.holderName, 100) || "Titular",
    type: c.type === "debit" ? "debit" : "credit",
    isPrimary: Boolean(c.isPrimary),
    isHidden: Boolean(c.isHidden),
    updatedAt: Timestamp.now(),
  };
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

// ---------- Migração ----------

/**
 * @param {object} o
 * @param {import("firebase-admin/firestore").Firestore} o.db
 * @param {Map<string, import("firebase-admin/auth").UserRecord>} o.authUsers
 */
export async function migrate({ db, authUsers, apply = false, deleteOld = false, projectId = "", log = console.log, table = console.table }) {
  const [oldUsers, oldTx, oldGoals, oldCards, oldPrefs] = await Promise.all(
    ["users", "transactions", "goals", "cards", "preferences"].map((c) => db.collection(c).get())
  );

  /** Plano de escrita por usuário */
  const plan = new Map();
  const userPlan = (uid) => {
    if (!plan.has(uid)) plan.set(uid, { profile: null, photo: null, tx: [], goals: [], cards: [], prefs: null });
    return plan.get(uid);
  };
  const toDelete = [];
  const orphans = [];

  const profileUids = new Set(oldUsers.docs.map((d) => d.id));
  const knownUid = (uid) => typeof uid === "string" && uid && (profileUids.has(uid) || authUsers.has(uid));

  for (const snap of oldUsers.docs) {
    const d = snap.data();
    const auth = authUsers.get(snap.id);
    const fullName = str(d.fullName, 100) || auth?.displayName || auth?.email || "Usuário";
    const p = userPlan(snap.id);
    p.profile = clean({
      fullName,
      email: (str(d.email, 200) || auth?.email || "").toLowerCase(),
      phone: str(d.phone, 30) ?? "",
      avatarInitials: str(d.avatarInitials, 3) || initials(fullName),
      createdAt: toTimestamp(d.createdAt, auth ? Timestamp.fromDate(new Date(auth.metadata.creationTime)) : undefined),
      updatedAt: toTimestamp(d.updatedAt),
    });
    if (typeof d.photoURL === "string" && d.photoURL.startsWith("data:image/")) {
      p.photo = { dataUrl: d.photoURL, updatedAt: Timestamp.now() };
    }
  }

  for (const [col, list, normalize] of [
    [oldTx, "tx", normalizeTransaction],
    [oldGoals, "goals", normalizeGoal],
  ]) {
    for (const snap of col.docs) {
      const uid = snap.data().userId;
      if (!knownUid(uid)) {
        orphans.push(`${snap.ref.path} (userId: ${uid ?? "ausente"})`);
        continue;
      }
      userPlan(uid)[list].push({ id: snap.id, data: normalize(snap.data()) });
      toDelete.push(snap.ref);
    }
  }

  for (const snap of oldCards.docs) {
    const cards = Array.isArray(snap.data().cards) ? snap.data().cards : [];
    cards.forEach((c) => userPlan(snap.id).cards.push({ id: str(c.id, 100) || db.collection("_").doc().id, data: normalizeCard(c) }));
    toDelete.push(snap.ref);
  }

  for (const snap of oldPrefs.docs) {
    const d = snap.data();
    userPlan(snap.id).prefs = clean({
      notifications: d.notifications ?? {},
      security: d.security ?? {},
      updatedAt: Timestamp.now(),
    });
    toDelete.push(snap.ref);
  }

  // Usuários com dados mas sem perfil: cria o perfil a partir do Authentication
  for (const [uid, p] of plan) {
    if (p.profile) continue;
    const auth = authUsers.get(uid);
    const fullName = auth?.displayName || auth?.email || "Usuário";
    p.profile = {
      fullName,
      email: (auth?.email ?? "").toLowerCase(),
      phone: "",
      avatarInitials: initials(fullName),
      createdAt: auth ? Timestamp.fromDate(new Date(auth.metadata.creationTime)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  // ---------- Relatório ----------

  log(`\nProjeto: ${projectId}`);
  log(apply ? "Modo: GRAVAR" + (deleteOld ? " e APAGAR coleções antigas" : "") : "Modo: SIMULAÇÃO (nada será gravado)");
  table(
    [...plan].map(([uid, p]) => ({
      usuario: p.profile.fullName,
      email: p.profile.email,
      uid,
      transacoes: p.tx.length,
      metas: p.goals.length,
      cartoes: p.cards.length,
      preferencias: p.prefs ? "sim" : "",
      foto: p.photo ? "sim" : "",
    }))
  );
  if (orphans.length) {
    log(`\n${orphans.length} documento(s) sem dono válido serão mantidos onde estão (não migrados nem apagados):`);
    orphans.forEach((o) => log("  -", o));
  }

  if (!apply) {
    log("\nNada foi gravado. Rode de novo com --apply para migrar.");
    return { plan, orphans, toDelete, written: 0, deleted: 0 };
  }

  // ---------- Escrita ----------

  const writes = [];
  for (const [uid, p] of plan) {
    const base = db.collection("users").doc(uid);
    writes.push((b) => b.set(base, p.profile)); // set sem merge: remove photoURL e campos soltos
    if (p.photo) writes.push((b) => b.set(base.collection("settings").doc("profilePhoto"), p.photo));
    if (p.prefs) writes.push((b) => b.set(base.collection("settings").doc("preferences"), p.prefs));
    p.tx.forEach(({ id, data }) => writes.push((b) => b.set(base.collection("transactions").doc(id), data)));
    p.goals.forEach(({ id, data }) => writes.push((b) => b.set(base.collection("goals").doc(id), data)));
    p.cards.forEach(({ id, data }) => writes.push((b) => b.set(base.collection("cards").doc(id), data)));
  }

  async function runInBatches(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const batch = db.batch();
      ops.slice(i, i + 400).forEach((op) => op(batch));
      await batch.commit();
    }
  }

  await runInBatches(writes);
  log(`\n✔ ${writes.length} documento(s) gravados no formato novo.`);

  let deleted = 0;
  if (deleteOld) {
    deleted = toDelete.length;
    await runInBatches(toDelete.map((ref) => (b) => b.delete(ref)));
    log(`✔ ${toDelete.length} documento(s) antigos apagados (transactions, goals, cards, preferences da raiz).`);
  } else {
    log("As coleções antigas foram mantidas. Depois de conferir o app, rode com --apply --delete-old para limpá-las.");
  }
  return { plan, orphans, toDelete, written: writes.length, deleted };
}
