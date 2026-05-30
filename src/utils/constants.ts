/** Constantes compartilhadas do app */

export const STORAGE_KEYS = {
  users: "financeflow-users",
  session: "financeflow-session",
  transactions: "financeflow-transactions",
  goals: "financeflow-goals",
  cards: "financeflow-cards",
  preferences: "financeflow-preferences",
  resetTokens: "financeflow-reset-tokens",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#079697",
  transport: "#5b6bf5",
  shopping: "#00d4aa",
  bills: "#ff6b9d",
  entertainment: "#ffd93d",
  health: "#ff6348",
  income: "#079697",
  savings: "#5b6bf5",
  transfer: "#8884d8",
  other: "#94a3b8",
};

export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  shopping: "🛍️",
  bills: "💡",
  entertainment: "🎬",
  health: "⚕️",
  income: "💰",
  savings: "🏦",
  transfer: "↔️",
  other: "📦",
};

export const GOAL_CATEGORIES = [
  "savings",
  "travel",
  "technology",
  "investment",
  "education",
  "other",
] as const;

export const PAYMENT_METHODS = [
  "creditCard",
  "debitCard",
  "cash",
  "digitalWallet",
] as const;

export const MIN_PASSWORD_LENGTH = 6;
