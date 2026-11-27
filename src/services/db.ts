/**
 * Organização do banco (Cloud Firestore)
 *
 * Todos os dados de um usuário ficam DENTRO do documento dele:
 *
 *   users/{uid}                          → perfil (nome, e-mail, telefone…)
 *   users/{uid}/transactions/{id}        → receitas, despesas e transferências
 *   users/{uid}/goals/{id}               → metas financeiras
 *   users/{uid}/cards/{id}               → cartões (só os 4 últimos dígitos)
 *   users/{uid}/settings/preferences     → notificações e segurança
 *   users/{uid}/settings/profilePhoto    → foto de perfil (separada para não poluir o perfil)
 *
 * Assim, no console do Firebase basta abrir users → {uid} para ver tudo
 * o que aquele usuário fez. Datas de criação/edição usam o horário do servidor.
 */
import {
  collection,
  doc,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export const userDoc = (uid: string) => doc(db, "users", uid);

export const transactionsCol = (uid: string) => collection(db, "users", uid, "transactions");
export const transactionDoc = (uid: string, id: string) => doc(db, "users", uid, "transactions", id);

export const goalsCol = (uid: string) => collection(db, "users", uid, "goals");
export const goalDoc = (uid: string, id: string) => doc(db, "users", uid, "goals", id);

export const cardsCol = (uid: string) => collection(db, "users", uid, "cards");
export const cardDoc = (uid: string, id: string) => doc(db, "users", uid, "cards", id);

export const preferencesDoc = (uid: string) => doc(db, "users", uid, "settings", "preferences");
export const profilePhotoDoc = (uid: string) => doc(db, "users", uid, "settings", "profilePhoto");

/** Converte Timestamp do Firestore (ou string antiga) para ISO string usada na interface */
export function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  // serverTimestamp() ainda pendente na escrita local
  return new Date().toISOString();
}

/** Lê um documento convertendo createdAt/updatedAt para string */
export function fromDoc<T>(snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): T {
  const data = snap.data() ?? {};
  return {
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  } as T;
}

/** Remove campos undefined (o Firestore não aceita) */
export function clean<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Campos controlados pelo sistema que nunca vêm da interface */
export function withoutSystemFields<T extends Record<string, unknown>>(data: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, userId, history, createdAt, updatedAt, ...rest } = data;
  return clean(rest);
}
