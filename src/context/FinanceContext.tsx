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
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
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
  addTransaction: (data: Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (data: Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateCards: (cards: PaymentCard[]) => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
  refreshData: () => void;
}

const defaultPreferences: UserPreferences = {
  notifications: {
    income: true,
    expenses: true,
    goals: true,
    reports: false,
    reminders: true,
  },
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessions: [],
  },
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Busca transações em tempo real
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.id),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Busca metas em tempo real
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "goals"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal)));
    });
    return () => unsub();
  }, [user]);

  // Busca preferências
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "preferences", user.id));
      if (snap.exists()) setPreferences(snap.data() as UserPreferences);
    };
    load();
  }, [user]);

  const refreshData = useCallback(() => {}, []);

  const dashboardStats = useMemo(() => computeDashboardStats(transactions), [transactions]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(transactions), [transactions]);
  const monthlyComparison = useMemo(() => computeMonthlyComparison(transactions), [transactions]);
  const highlights = useMemo(() => getHighlightCards(transactions, goals), [transactions, goals]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">) => {
      if (!user) return;
      const now = new Date().toISOString();
      await addDoc(collection(db, "transactions"), {
      ...data,
      type: data.type ?? "expense",
      userId: user.id,
      history: [{ date: now, action: "created" }],
      createdAt: serverTimestamp(),
      updatedAt: now,
    });
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      if (!user) return;
      const now = new Date().toISOString();
      await updateDoc(doc(db, "transactions", id), {
        ...data,
        updatedAt: now,
      });
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "transactions", id));
    },
    [user]
  );

  const addGoal = useCallback(
    async (data: Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">) => {
      if (!user) return;
      const now = new Date().toISOString();
      await addDoc(collection(db, "goals"), {
        ...data,
        userId: user.id,
        status: "active",
        history: [{ date: now, action: "created" }],
        createdAt: serverTimestamp(),
        updatedAt: now,
      });
    },
    [user]
  );

  const updateGoal = useCallback(
    async (id: string, data: Partial<Goal>) => {
      if (!user) return;
      await updateDoc(doc(db, "goals", id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    [user]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "goals", id));
    },
    [user]
  );

  const updateCards = useCallback(
    async (newCards: PaymentCard[]) => {
      if (!user) return;
      await setDoc(doc(db, "cards", user.id), { cards: newCards });
      setCards(newCards);
    },
    [user]
  );

  const updatePreferences = useCallback(
    async (prefs: UserPreferences) => {
      if (!user) return;
      await setDoc(doc(db, "preferences", user.id), prefs);
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