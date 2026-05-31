import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Award,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import { formatCurrency, formatRelativeDate } from "../../utils/format";
import { LoadingSpinner, EmptyState } from "./shared/UiHelpers";

const GOAL_NAME_KEYS = ["emergencyFund", "vacationBali", "newLaptop", "investmentPortfolio"];

function getGoalDisplayName(name: string, t: (key: string) => string) {
  if (GOAL_NAME_KEYS.includes(name)) return t(`goals.${name}`);
  return name;
}

export default function HomeDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    transactions,
    dashboardStats,
    categoryBreakdown,
    monthlyComparison,
    highlights,
    goals,
    isLoading,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 4);

  const pieData = categoryBreakdown.map((cat) => ({
    name: t(`categories.${cat.key}`),
    value: cat.amount,
    color: cat.color,
  }));

  const lineData = monthlyComparison.map((m) => {
    const [, month] = m.monthKey.split("-");
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthKey = monthNames[parseInt(month, 10) - 1] ?? "jan";
    return {
      month: t(`months.${monthKey}`),
      balance: m.income - m.expenses,
    };
  });

  const barData = monthlyComparison.map((m) => {
    const [, month] = m.monthKey.split("-");
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthKey = monthNames[parseInt(month, 10) - 1] ?? "jan";
    return {
      month: t(`months.${monthKey}`),
      income: m.income,
      expenses: m.expenses,
    };
  });

  if (isLoading) {
    return (
      <div className="ff-page">
        <LoadingSpinner label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="ff-page">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="ff-text-muted text-sm">{t("home.welcomeBack")}</p>
            <h2 className="ff-heading text-2xl">{user?.fullName ?? ""}</h2>
          </div>
          <div className="w-12 h-12 rounded-full ff-avatar flex items-center justify-center font-semibold text-sm">
            {user?.avatarInitials ?? "?"}
          </div>
        </div>

        {/* Resumo financeiro */}
        <motion.div className="relative ff-gradient-banner p-6 mb-6" whileHover={{ scale: 1.01 }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm mb-2 opacity-80">{t("home.totalBalance")}</p>
            <h1 className="text-3xl font-bold mb-4">{formatCurrency(dashboardStats.totalBalance)}</h1>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm">
                {t("home.accumulatedSavings")}: {formatCurrency(dashboardStats.accumulatedSavings)}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="ff-card-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full ff-icon-chip flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="ff-text-muted text-sm">{t("home.income")}</p>
            </div>
            <p className="ff-heading text-lg font-semibold">
              {formatCurrency(dashboardStats.monthlyIncome)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--ff-cyan)" }}>
              {dashboardStats.incomeChangePercent >= 0 ? "+" : ""}
              {dashboardStats.incomeChangePercent.toFixed(1)}% {t("home.fromLastMonth")}
            </p>
          </div>

          <div className="ff-card-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "color-mix(in srgb, var(--ff-expense) 20%, transparent)" }}
              >
                <TrendingDown className="w-4 h-4" style={{ color: "var(--ff-expense)" }} />
              </div>
              <p className="ff-text-muted text-sm">{t("home.expenses")}</p>
            </div>
            <p className="ff-heading text-lg font-semibold">
              {formatCurrency(dashboardStats.monthlyExpenses)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--ff-expense)" }}>
              {dashboardStats.expenseChangePercent >= 0 ? "+" : ""}
              {dashboardStats.expenseChangePercent.toFixed(1)}% {t("home.fromLastMonth")}
            </p>
          </div>
        </div>

        {/* Cartões de destaque */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {highlights.biggestExpense && (
            <div className="ff-card-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--ff-warning)" }} />
              <div className="flex-1">
                <p className="ff-text-muted text-xs">{t("home.biggestExpense")}</p>
                <p className="ff-text font-medium">{highlights.biggestExpense.name}</p>
              </div>
              <p className="font-semibold" style={{ color: "var(--ff-expense)" }}>
                {formatCurrency(highlights.biggestExpense.amount)}
              </p>
            </div>
          )}
          {highlights.topCategory && (
            <div className="ff-card-lg p-4 flex items-center gap-3">
              <Award className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
              <div className="flex-1">
                <p className="ff-text-muted text-xs">{t("home.topCategory")}</p>
                <p className="ff-text font-medium">{t(`categories.${highlights.topCategory}`)}</p>
              </div>
            </div>
          )}
          {highlights.closestGoal && (
            <div className="ff-card-lg p-4 flex items-center gap-3">
              <Target className="w-5 h-5" style={{ color: "var(--ff-blue)" }} />
              <div className="flex-1">
                <p className="ff-text-muted text-xs">{t("home.closestGoal")}</p>
                <p className="ff-text font-medium">
                  {getGoalDisplayName(highlights.closestGoal.goal.name, t)}
                </p>
              </div>
              <p className="font-semibold" style={{ color: "var(--ff-cyan)" }}>
                {(highlights.closestGoal.progress * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* Gráfico de linha — evolução financeira */}
        <div className="ff-card-lg p-4 mb-6">
          <h3 className="ff-heading font-semibold mb-4">{t("home.financialEvolution")}</h3>
          <div className="h-40">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="month" stroke="var(--ff-chart-axis)" style={{ fontSize: "11px" }} />
                  <YAxis stroke="var(--ff-chart-axis)" style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="balance" stroke="#079697" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </div>
        </div>

        {/* Gráfico de barras — receitas x despesas */}
        <div className="ff-card-lg p-4 mb-6">
          <h3 className="ff-heading font-semibold mb-4">{t("home.incomeVsExpenses")}</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="month" stroke="var(--ff-chart-axis)" style={{ fontSize: "11px" }} />
                <YAxis stroke="var(--ff-chart-axis)" style={{ fontSize: "11px" }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" fill="#079697" name={t("home.income")} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ff6b9d" name={t("home.expenses")} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico pizza — categorias */}
        <div className="ff-card-lg p-4 mb-6">
          <h3 className="ff-heading font-semibold mb-4">{t("home.spendingByCategory")}</h3>
          {pieData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </div>

        {/* Categorias em barras */}
        {categoryBreakdown.length > 0 && (
          <div className="mb-6">
            <h3 className="ff-heading font-semibold mb-4">{t("home.categories")}</h3>
            <div className="grid grid-cols-2 gap-3">
              {categoryBreakdown.slice(0, 4).map((cat) => (
                <div key={cat.key} className="ff-card-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="ff-text text-sm">{t(`categories.${cat.key}`)}</p>
                    <p className="ff-text-muted text-xs">{cat.percent}%</p>
                  </div>
                  <p className="ff-heading font-semibold mb-2">{formatCurrency(cat.amount)}</p>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--ff-accent-highlight)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transações recentes */}
        <div>
          <h3 className="ff-heading font-semibold mb-4">{t("home.recentTransactions")}</h3>
          {recentTransactions.length === 0 ? (
            <EmptyState title={t("transactions.empty")} description={t("transactions.emptyHint")} />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  className="ff-card-lg p-4 flex items-center gap-4"
                  whileHover={{ scale: 1.01 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        transaction.type === "income"
                          ? "color-mix(in srgb, var(--ff-cyan) 20%, transparent)"
                          : "color-mix(in srgb, var(--ff-expense) 20%, transparent)",
                    }}
                  >
                    {transaction.type === "income" ? (
                      <ArrowDownRight className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" style={{ color: "var(--ff-expense)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="ff-text font-medium truncate">{transaction.name}</p>
                    <p className="ff-text-muted text-xs">{t(`categories.${transaction.category}`)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-semibold text-sm"
                      style={{
                        color:
                          transaction.type === "income" ? "var(--ff-cyan)" : "var(--ff-text)",
                      }}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="ff-text-muted text-xs">
                      {formatRelativeDate(transaction.date, t)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
