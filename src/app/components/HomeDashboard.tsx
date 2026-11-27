import { TrendingUp, TrendingDown, Award, Target, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import { formatCurrency, formatRelativeDate } from "../../utils/format";
import { LoadingSpinner, EmptyState } from "./shared/UiHelpers";
import { ScreenHeader } from "./shared/ScreenHeader";
import { TransactionRow } from "./shared/TransactionRow";
import BalanceHero from "./BalanceHero";

const GOAL_NAME_KEYS = ["emergencyFund", "vacationBali", "newLaptop", "investmentPortfolio"];
const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function getGoalDisplayName(name: string, t: (key: string) => string) {
  if (GOAL_NAME_KEYS.includes(name)) return t(`goals.${name}`);
  return name;
}

/** Tooltip dos gráficos no estilo do app (o padrão do Recharts é branco) */
const tooltipProps = {
  cursor: { stroke: "var(--ff-border-strong)", fill: "var(--ff-surface)" },
  contentStyle: {
    background: "var(--ff-bg)",
    border: "1px solid var(--ff-border-strong)",
    borderRadius: 12,
    color: "var(--ff-text)",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
  },
  labelStyle: { color: "var(--ff-text-muted)", marginBottom: 4 },
  formatter: (v: number) => formatCurrency(v),
};

const axisProps = {
  stroke: "var(--ff-chart-axis)",
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: "var(--ff-text-faint)" },
  dy: 6,
};

function ChangeBadge({ value, goodWhenUp }: { value: number; goodWhenUp: boolean }) {
  const { t } = useLanguage();
  const good = value === 0 || (value > 0) === goodWhenUp;
  return (
    <p
      className="ff-num text-xs mt-1"
      style={{ color: good ? "var(--ff-success)" : "var(--ff-expense)" }}
    >
      {value > 0 ? "+" : value < 0 ? "−" : ""}
      {Math.abs(value).toFixed(1)}% <span className="ff-text-faint">{t("home.fromLastMonth")}</span>
    </p>
  );
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
    isLoading,
  } = useFinance();

  const recentTransactions = transactions.slice(0, 4);

  const monthLabel = (monthKey: string) => {
    const [, month] = monthKey.split("-");
    return t(`months.${MONTH_KEYS[parseInt(month, 10) - 1] ?? "jan"}`);
  };

  const lineData = monthlyComparison.map((m) => ({
    month: monthLabel(m.monthKey),
    balance: m.income - m.expenses,
  }));

  const barData = monthlyComparison.map((m) => ({
    month: monthLabel(m.monthKey),
    income: m.income,
    expenses: m.expenses,
  }));

  const pieData = categoryBreakdown.map((cat) => ({
    name: t(`categories.${cat.key}`),
    value: cat.amount,
    color: cat.color,
  }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

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
        <ScreenHeader
          overline={t("home.welcomeBack")}
          title={user?.fullName ?? ""}
          action={
            <div className="w-11 h-11 rounded-full ff-avatar flex items-center justify-center font-semibold text-sm">
              {user?.avatarInitials ?? "?"}
            </div>
          }
        />

        <BalanceHero
          balance={dashboardStats.totalBalance}
          monthNet={dashboardStats.monthlyIncome - dashboardStats.monthlyExpenses}
          trend={lineData.map((d) => d.balance)}
        />

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="ff-card-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="ff-cat-icon w-8 h-8" style={{ ["--ff-cat" as string]: "var(--ff-success)" }}>
                <TrendingUp className="w-4 h-4" />
              </span>
              <p className="ff-text-muted text-sm">{t("home.income")}</p>
            </div>
            <p className="ff-heading ff-num text-lg tracking-[-0.01em]">
              {formatCurrency(dashboardStats.monthlyIncome)}
            </p>
            <ChangeBadge value={dashboardStats.incomeChangePercent} goodWhenUp />
          </div>

          <div className="ff-card-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="ff-cat-icon w-8 h-8" style={{ ["--ff-cat" as string]: "var(--ff-expense)" }}>
                <TrendingDown className="w-4 h-4" />
              </span>
              <p className="ff-text-muted text-sm">{t("home.expenses")}</p>
            </div>
            <p className="ff-heading ff-num text-lg tracking-[-0.01em]">
              {formatCurrency(dashboardStats.monthlyExpenses)}
            </p>
            {/* despesa que cai é boa notícia: verde */}
            <ChangeBadge value={dashboardStats.expenseChangePercent} goodWhenUp={false} />
          </div>
        </div>

        {/* Destaques do mês, num único grupo */}
        {(highlights.biggestExpense || highlights.topCategory || highlights.closestGoal) && (
          <div className="ff-group mb-6">
            {highlights.biggestExpense && (
              <div className="ff-row">
                <span className="ff-cat-icon" style={{ ["--ff-cat" as string]: "var(--ff-warning)" }}>
                  <AlertTriangle className="w-[1.15rem] h-[1.15rem]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block ff-text-muted text-xs">{t("home.biggestExpense")}</span>
                  <span className="block ff-text font-medium truncate">
                    {highlights.biggestExpense.name}
                  </span>
                </span>
                <span className="ff-num font-semibold">
                  −{formatCurrency(highlights.biggestExpense.amount)}
                </span>
              </div>
            )}
            {highlights.topCategory && (
              <div className="ff-row">
                <span className="ff-cat-icon">
                  <Award className="w-[1.15rem] h-[1.15rem]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block ff-text-muted text-xs">{t("home.topCategory")}</span>
                  <span className="block ff-text font-medium">
                    {t(`categories.${highlights.topCategory}`)}
                  </span>
                </span>
              </div>
            )}
            {highlights.closestGoal && (
              <div className="ff-row">
                <span className="ff-cat-icon" style={{ ["--ff-cat" as string]: "var(--ff-blue)" }}>
                  <Target className="w-[1.15rem] h-[1.15rem]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block ff-text-muted text-xs">{t("home.closestGoal")}</span>
                  <span className="block ff-text font-medium truncate">
                    {getGoalDisplayName(highlights.closestGoal.goal.name, t)}
                  </span>
                  <span
                    className="block h-1 rounded-full mt-2 overflow-hidden"
                    style={{ background: "var(--ff-accent-highlight)" }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.min(100, highlights.closestGoal.progress * 100)}%`,
                        background: "var(--ff-gradient-card)",
                      }}
                    />
                  </span>
                </span>
                <span className="ff-num font-semibold" style={{ color: "var(--ff-cyan)" }}>
                  {(highlights.closestGoal.progress * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Evolução do saldo */}
        <section className="ff-card-lg p-4 pb-2 mb-6">
          <h2 className="ff-heading text-base mb-3">{t("home.financialEvolution")}</h2>
          <div className="h-36 -mx-1">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="ff-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#079697" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#079697" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#079697"
                    strokeWidth={2.25}
                    fill="url(#ff-area)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#00d4aa" }}
                    name={t("home.totalBalance")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={t("common.noData")} />
            )}
          </div>
        </section>

        {/* Receitas x despesas */}
        <section className="ff-card-lg p-4 pb-2 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="ff-heading text-base">{t("home.incomeVsExpenses")}</h2>
            <div className="flex items-center gap-3 text-xs ff-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#079697" }} />
                {t("home.income")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#ff6b9d" }} />
                {t("home.expenses")}
              </span>
            </div>
          </div>
          <div className="h-40 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={3} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey="month" {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey="income" fill="#079697" name={t("home.income")} radius={[6, 6, 6, 6]} maxBarSize={14} />
                <Bar dataKey="expenses" fill="#ff6b9d" name={t("home.expenses")} radius={[6, 6, 6, 6]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Gasto por categoria: rosca com total no centro + legenda com barras */}
        <section className="ff-card-lg p-4 mb-6">
          <h2 className="ff-heading text-base mb-3">{t("home.spendingByCategory")}</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="68%"
                      outerRadius="100%"
                      paddingAngle={2}
                      cornerRadius={4}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="ff-text-faint text-[0.65rem]">{t("home.expenses")}</span>
                  <span className="ff-heading ff-num text-xs">{formatCurrency(pieTotal)}</span>
                </div>
              </div>
              <ul className="flex-1 min-w-0 space-y-2.5">
                {categoryBreakdown.slice(0, 5).map((cat) => (
                  <li key={cat.key}>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="flex items-center gap-1.5 ff-text truncate">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        {t(`categories.${cat.key}`)}
                      </span>
                      <span className="ff-num ff-text-muted">{cat.percent}%</span>
                    </div>
                    <div
                      className="h-1 rounded-full mt-1 overflow-hidden"
                      style={{ background: "var(--ff-accent-highlight)" }}
                    >
                      <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, background: cat.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </section>

        {/* Transações recentes */}
        <section>
          <h2 className="ff-heading text-base mb-3">{t("home.recentTransactions")}</h2>
          {recentTransactions.length === 0 ? (
            <EmptyState title={t("transactions.empty")} description={t("transactions.emptyHint")} />
          ) : (
            <div className="ff-group">
              {recentTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  meta={formatRelativeDate(transaction.date, t)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
