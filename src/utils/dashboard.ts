import type {
  CategorySummary,
  DashboardStats,
  Goal,
  MonthlyComparison,
  Transaction,
} from "../types";
import { CATEGORY_COLORS } from "./constants";
import { getMonthKey, isSameMonth } from "./format";

/** Calcula estatísticas do dashboard a partir das transações */
export function computeDashboardStats(transactions: Transaction[]): DashboardStats {
  const now = new Date();
  const currentMonth = transactions.filter((t) => isSameMonth(t.date, now));
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = transactions.filter((t) => isSameMonth(t.date, lastMonth));

  const monthlyIncome = currentMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = currentMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const prevIncome = previousMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const prevExpenses = previousMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return {
    totalBalance: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    accumulatedSavings: Math.max(0, totalIncome - totalExpenses),
    incomeChangePercent: prevIncome ? ((monthlyIncome - prevIncome) / prevIncome) * 100 : 0,
    expenseChangePercent: prevExpenses
      ? ((monthlyExpenses - prevExpenses) / prevExpenses) * 100
      : 0,
  };
}

export function computeCategoryBreakdown(transactions: Transaction[]): CategorySummary[] {
  const now = new Date();
  const expenses = transactions.filter(
    (t) => t.type === "expense" && isSameMonth(t.date, now)
  );
  const total = expenses.reduce((s, t) => s + t.amount, 0) || 1;

  const map = new Map<string, number>();
  expenses.forEach((t) => {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  });

  return Array.from(map.entries())
    .map(([key, amount]) => ({
      key,
      amount,
      percent: Math.round((amount / total) * 100),
      color: CATEGORY_COLORS[key] ?? CATEGORY_COLORS.other,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeMonthlyComparison(transactions: Transaction[]): MonthlyComparison[] {
  const months: MonthlyComparison[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(d);
    const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));

    months.push({
      monthKey,
      income: monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }

  return months;
}

export function getHighlightCards(
  transactions: Transaction[],
  goals: Goal[]
) {
  const now = new Date();
  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && isSameMonth(t.date, now)
  );

  const biggestExpense = monthExpenses.reduce(
    (max, t) => (t.amount > (max?.amount ?? 0) ? t : max),
    null as Transaction | null
  );

  const categoryCount = new Map<string, number>();
  monthExpenses.forEach((t) => {
    categoryCount.set(t.category, (categoryCount.get(t.category) ?? 0) + 1);
  });
  const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const activeGoals = goals.filter((g) => g.status === "active");
  const closestGoal = activeGoals.reduce(
    (best, g) => {
      const progress = g.currentAmount / g.targetAmount;
      return !best || progress > best.progress ? { goal: g, progress } : best;
    },
    null as { goal: Goal; progress: number } | null
  );

  return { biggestExpense, topCategory, closestGoal };
}
