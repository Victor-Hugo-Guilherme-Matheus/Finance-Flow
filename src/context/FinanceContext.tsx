import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Goal, PaymentCard, Transaction, UserPreferences } from "../types";
import { financeService } from "../services/dataService";
import {
  computeCategoryBreakdown,
  computeDashboardStats,
  computeMonthlyComparison,
  getHighlightCards,
} from "../utils/dashboard";
import { useAuth } from "./AuthContext";

interface FinanceContextValue {
  transactions: Transaction[];
  goals: Goal[];
  cards: PaymentCard[];
  preferences: UserPreferences;
  isLoading: boolean;
  dashboardStats: ReturnType<typeof computeDashboardStats>;
  categoryBreakdown: ReturnType<typeof computeCategoryBreakdown>;
  monthlyComparison: ReturnType<typeof computeMonthlyComparison>;
  highlights: ReturnType<typeof getHighlightCards>;
  addTransaction: (
    data: Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">
  ) => Transaction;
  updateTransaction: (id: string, data: Partial<Transaction>) => Transaction | null;
  deleteTransaction: (id: string) => void;
  addGoal: (data: Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">) => Goal;
  updateGoal: (id: string, data: Partial<Goal>) => Goal | null;
  deleteGoal: (id: string) => void;
  updateCards: (cards: PaymentCard[]) => void;
  updatePreferences: (prefs: UserPreferences) => void;
  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(
    financeService.getPreferences("")
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    financeService.initializeUserData(user.id);
    setTransactions(financeService.getTransactions(user.id));
    setGoals(financeService.getGoals(user.id));
    setCards(financeService.getCards(user.id));
    setPreferences(financeService.getPreferences(user.id));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const dashboardStats = useMemo(
    () => computeDashboardStats(transactions),
    [transactions]
  );
  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions),
    [transactions]
  );
  const monthlyComparison = useMemo(
    () => computeMonthlyComparison(transactions),
    [transactions]
  );
  const highlights = useMemo(
    () => getHighlightCards(transactions, goals),
    [transactions, goals]
  );

  const addTransaction = useCallback(
    (data: Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">) => {
      if (!user) throw new Error("Not authenticated");
      const tx = financeService.addTransaction(user.id, data);
      setTransactions(financeService.getTransactions(user.id));
      return tx;
    },
    [user]
  );

  const updateTransaction = useCallback(
    (id: string, data: Partial<Transaction>) => {
      if (!user) return null;
      const result = financeService.updateTransaction(user.id, id, data);
      setTransactions(financeService.getTransactions(user.id));
      return result;
    },
    [user]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      if (!user) return;
      financeService.deleteTransaction(user.id, id);
      setTransactions(financeService.getTransactions(user.id));
    },
    [user]
  );

  const addGoal = useCallback(
    (data: Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">) => {
      if (!user) throw new Error("Not authenticated");
      const goal = financeService.addGoal(user.id, data);
      setGoals(financeService.getGoals(user.id));
      return goal;
    },
    [user]
  );

  const updateGoal = useCallback(
    (id: string, data: Partial<Goal>) => {
      if (!user) return null;
      const result = financeService.updateGoal(user.id, id, data);
      setGoals(financeService.getGoals(user.id));
      return result;
    },
    [user]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      if (!user) return;
      financeService.deleteGoal(user.id, id);
      setGoals(financeService.getGoals(user.id));
    },
    [user]
  );

  const updateCards = useCallback(
    (newCards: PaymentCard[]) => {
      if (!user) return;
      financeService.saveCards(user.id, newCards);
      setCards(newCards);
    },
    [user]
  );

  const updatePreferences = useCallback(
    (prefs: UserPreferences) => {
      if (!user) return;
      financeService.savePreferences(user.id, prefs);
      setPreferences(prefs);
    },
    [user]
  );

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        goals,
        cards,
        preferences,
        isLoading,
        dashboardStats,
        categoryBreakdown,
        monthlyComparison,
        highlights,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
        updateCards,
        updatePreferences,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
