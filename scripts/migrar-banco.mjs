#!/usr/bin/env node
/**
 * Migra o Firestore do formato antigo (coleções soltas na raiz) para o novo,
 * em que tudo de um usuário fica dentro do documento dele:
 *
 *   ANTES                                   DEPOIS
 *   users/{uid}  (+ photoURL base64)   →    users/{uid}                        (perfil limpo)
 *                                            users/{uid}/settings/profilePhoto
 *   transactions/{id}  (userId)        →    users/{uid}/transactions/{id}
 *   goals/{id}         (userId)        →    users/{uid}/goals/{id}
 *   cards/{uid}  { cards: [...] }      →    users/{uid}/cards/{id}
 *   preferences/{uid}                  →    users/{uid}/settings/preferences
 *
 * Também padroniza os dados: createdAt/updatedAt viram Timestamp, campos
 * desconhecidos são descartados, valores negativos sem tipo viram despesa.
 *
 * Uso:
 *   node scripts/migrar-banco.mjs                 # só mostra o que seria feito (não grava nada)
 *   node scripts/migrar-banco.mjs --apply         # copia para o formato novo
 *   node scripts/migrar-banco.mjs --apply --delete-old   # copia e apaga as coleções antigas
 *
 * Credenciais (o Admin SDK ignora as regras de segurança):
 *   - GOOGLE_APPLICATION_CREDENTIALS=caminho/da/chave.json  (Console → Configurações do projeto
 *     → Contas de serviço → Gerar nova chave privada), ou
 *   - gcloud auth application-default login
 * Para testar no emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 */
import { readFileSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { migrate } from "./lib/migracao.mjs";
import { getAuth } from "firebase-admin/auth";

const APPLY = process.argv.includes("--apply");
const DELETE_OLD = process.argv.includes("--delete-old");
if (DELETE_OLD && !APPLY) {
  console.error("--delete-old só funciona junto com --apply.");
  process.exit(1);
}

const projectId =
  process.env.GCLOUD_PROJECT ||
  JSON.parse(readFileSync(new URL("../.firebaserc", import.meta.url), "utf8")).projects.default;

const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
initializeApp(emulator ? { projectId } : { projectId, credential: applicationDefault() });
const db = getFirestore();

async function listAuthUsers() {
  const map = new Map();
  try {
    let pageToken;
    do {
      const page = await getAuth().listUsers(1000, pageToken);
      page.users.forEach((u) => map.set(u.uid, u));
      pageToken = page.pageToken;
    } while (pageToken);
  } catch (err) {
    console.warn(`(Aviso) Não consegui listar o Authentication: ${err.message}`);
  }
  return map;
}

await migrate({
  db,
  authUsers: await listAuthUsers(),
  apply: APPLY,
  deleteOld: DELETE_OLD,
  projectId: projectId + (emulator ? " (EMULADOR)" : ""),
});
