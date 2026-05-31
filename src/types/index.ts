/** Tipos de domínio — preparados para futura integração com API/banco de dados */

export type TransactionType = "income" | "expense" | "transfer";

export type GoalStatus = "active" | "completed" | "closed";

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "other";

export type CardType = "credit" | "debit";

export interface TransactionHistoryEntry {
  date: string;
  action: string;
}

export interface Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  history: TransactionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalHistoryEntry {
  date: string;
  action: string;
  amount?: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  icon: string;
  color: string;
  status: GoalStatus;
  history: GoalHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  /** Senha simulada — em produção seria hash no backend */
  password: string;
  phone?: string;
  avatarInitials?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface PaymentCard {
  id: string;
  name: string;
  number: string;
  expiry: string;
  cvv: string;
  brand: CardBrand;
  holderName: string;
  type: CardType;
  isPrimary: boolean;
  isHidden: boolean;
}

export interface NotificationPreferences {
  income: boolean;
  expenses: boolean;
  goals: boolean;
  reports: boolean;
  reminders: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessions: ActiveSession[];
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  security: SecuritySettings;
}

export interface ResetToken {
  email: string;
  token: string;
  expiresAt: string;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accumulatedSavings: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
}

export interface CategorySummary {
  key: string;
  amount: number;
  percent: number;
  color: string;
}

export interface MonthlyComparison {
  monthKey: string;
  income: number;
  expenses: number;
}
