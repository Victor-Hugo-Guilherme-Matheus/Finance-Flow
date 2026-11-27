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
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import {
  cardDoc,
  cardsCol,
  clean,
  fromDoc,
  goalDoc,
  goalsCol,
  preferencesDoc,
  transactionDoc,
  transactionsCol,
  withoutSystemFields,
} from "../services/db";
import {
  computeCategoryBreakdown,
  computeDashboardStats,
  computeMonthlyComparison,
  getHighlightCards,
} from "../utils/dashboard";
import { toSafeCard } from "../utils/validation";
import { useAuth } from "./AuthContext";

type NewTransaction = Omit<Transaction, "id" | "history" | "createdAt" | "updatedAt">;
type NewGoal = Omit<Goal, "id" | "history" | "status" | "createdAt" | "updatedAt">;

interface FinanceContextValue {
  transactions: Transaction[];
  goals: Goal[];
  cards: PaymentCard[];
  preferences: UserPreferences;
  isLoading: boolean;
  /** Chave de tradução do último erro de leitura do banco, se houver */
  loadError: string | null;
  dashboardStats: ReturnType<typeof computeDashboardStats>;
  categoryBreakdown: ReturnType<typeof computeCategoryBreakdown>;
  monthlyComparison: ReturnType<typeof computeMonthlyComparison>;
  highlights: ReturnType<typeof getHighlightCards>;
  addTransaction: (data: NewTransaction) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (data: NewGoal) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateCards: (cards: PaymentCard[]) => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
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

function historyEntry(action: string, amount?: number) {
  return clean({ date: new Date().toISOString(), action, amount });
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Escuta em tempo real tudo que pertence ao usuário logado.
  // Ao sair (uid = null) os dados da sessão anterior são apagados da memória.
  useEffect(() => {
    setTransactions([]);
    setGoals([]);
    setCards([]);
    setPreferences(defaultPreferences);
    setLoadError(null);
    setIsLoading(true);
    if (!uid) return;

    const onError = (err: unknown) => {
      console.error("Erro ao ler dados do Firestore:", err);
      setLoadError("common.error");
      setIsLoading(false);
    };

    const unsubs = [
      onSnapshot(
        query(transactionsCol(uid), orderBy("date", "desc")),
        (snap) => {
          setTransactions(snap.docs.map((d) => fromDoc<Transaction>(d)));
          setIsLoading(false);
        },
        onError
      ),
      onSnapshot(
        query(goalsCol(uid), orderBy("createdAt", "desc")),
        (snap) => setGoals(snap.docs.map((d) => fromDoc<Goal>(d))),
        onError
      ),
      onSnapshot(
        cardsCol(uid),
        (snap) =>
          setCards(
            snap.docs
              .map((d) => toSafeCard({ ...d.data(), id: d.id }))
              .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name))
          ),
        onError
      ),
      onSnapshot(
        preferencesDoc(uid),
        (snap) => {
          if (snap.exists()) {
            const { notifications, security } = snap.data() as Partial<UserPreferences>;
            setPreferences({
              notifications: { ...defaultPreferences.notifications, ...notifications },
              security: { ...defaultPreferences.security, ...security },
            });
          }
        },
        onError
      ),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [uid]);

  const dashboardStats = useMemo(() => computeDashboardStats(transactions), [transactions]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(transactions), [transactions]);
  const monthlyComparison = useMemo(() => computeMonthlyComparison(transactions), [transactions]);
  const highlights = useMemo(() => getHighlightCards(transactions, goals), [transactions, goals]);

  const addTransaction = useCallback(
    async (data: NewTransaction) => {
      if (!uid) return;
      await addDoc(transactionsCol(uid), {
        ...withoutSystemFields(data),
        type: data.type ?? "expense",
        history: [historyEntry("created")],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [uid]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      if (!uid) return;
      await updateDoc(transactionDoc(uid, id), {
        ...withoutSystemFields(data),
        history: arrayUnion(historyEntry("updated")),
        updatedAt: serverTimestamp(),
      });
    },
    [uid]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(transactionDoc(uid, id));
    },
    [uid]
  );

  const addGoal = useCallback(
    async (data: NewGoal) => {
      if (!uid) return;
      await addDoc(goalsCol(uid), {
        ...withoutSystemFields(data),
        status: "active",
        history: [historyEntry("created", data.currentAmount)],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [uid]
  );

  const updateGoal = useCallback(
    async (id: string, data: Partial<Goal>) => {
      if (!uid) return;
      const action =
        data.status === "completed" ? "completed" : data.status === "closed" ? "closed" : "updated";
      await updateDoc(goalDoc(uid, id), {
        ...withoutSystemFields(data),
        history: arrayUnion(historyEntry(action, data.currentAmount)),
        updatedAt: serverTimestamp(),
      });
    },
    [uid]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(goalDoc(uid, id));
    },
    [uid]
  );

  /**
   * Recebe a lista completa de cartões (como a tela de cartões trabalha) e
   * sincroniza com a subcoleção: grava os novos/alterados e apaga os removidos.
   */
  const updateCards = useCallback(
    async (newCards: PaymentCard[]) => {
      if (!uid) return;
      const batch = writeBatch(db);
      const keep = new Set<string>();

      newCards.forEach((card) => {
        // Garante que nenhum número completo ou CVV chegue ao Firestore
        const { id, ...safe } = toSafeCard({ ...card });
        const ref = id ? cardDoc(uid, id) : cardDoc(uid, crypto.randomUUID());
        keep.add(ref.id);
        batch.set(ref, { ...safe, updatedAt: serverTimestamp() });
      });
      cards.filter((c) => !keep.has(c.id)).forEach((c) => batch.delete(cardDoc(uid, c.id)));

      await batch.commit();
    },
    [uid, cards]
  );

  const updatePreferences = useCallback(
    async (prefs: UserPreferences) => {
      if (!uid) return;
      setPreferences(prefs);
      await setDoc(preferencesDoc(uid), { ...prefs, updatedAt: serverTimestamp() });
    },
    [uid]
  );

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        goals,
        cards,
        preferences,
        isLoading,
        loadError,
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
