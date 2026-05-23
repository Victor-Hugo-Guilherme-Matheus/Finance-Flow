import { motion } from "motion/react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";

const chartData = [
  { monthKey: "jan", value: 2400 },
  { monthKey: "feb", value: 3200 },
  { monthKey: "mar", value: 2800 },
  { monthKey: "apr", value: 4100 },
  { monthKey: "may", value: 3600 },
  { monthKey: "jun", value: 4800 },
];

const transactions = [
  { id: 1, name: "Spotify", categoryKey: "entertainment", amount: -12.99, dateKey: "today" as const },
  { id: 2, name: "Salary", categoryKey: "income", amount: 4500, dateKey: "yesterday" as const },
  { id: 3, name: "Grocery Store", categoryKey: "food", amount: -86.45, dateKey: "yesterday" as const },
  { id: 4, name: "Uber", categoryKey: "transport", amount: -23.5, dateKey: "daysAgo", days: 2 },
];

const categories = [
  { key: "food", amount: 854, percent: 35, color: "#079697" },
  { key: "transport", amount: 432, percent: 18, color: "#5b6bf5" },
  { key: "shopping", amount: 678, percent: 28, color: "#00d4aa" },
  { key: "bills", amount: 456, percent: 19, color: "#ff6b9d" },
];

export default function HomeDashboard() {
  const { t } = useLanguage();

  const chartDataLocalized = chartData.map((item) => ({
    month: t(`months.${item.monthKey}`),
    value: item.value,
  }));

  const formatDate = (tx: (typeof transactions)[number]) => {
    if (tx.dateKey === "daysAgo" && "days" in tx) {
      return t("dates.daysAgo", { count: tx.days });
    }
    return t(`dates.${tx.dateKey}`);
  };

  return (
    <div className="ff-page">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="ff-text-muted text-sm">{t("home.welcomeBack")}</p>
            <h2 className="ff-heading text-2xl">Victor Hugo</h2>
          </div>
          <div className="w-12 h-12 rounded-full ff-avatar flex items-center justify-center font-semibold text-sm">
            VH
          </div>
        </div>

        <motion.div
          className="relative ff-gradient-banner p-6 mb-6"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm mb-2 opacity-80">{t("home.totalBalance")}</p>
            <h1 className="text-4xl font-bold mb-4">$12,456.80</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm">+12.5%</span>
              </div>
              <button className="ml-auto bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-all">
                <Plus className="w-5 h-5" />
              </button>
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
            <p className="ff-heading text-xl font-semibold">$6,420</p>
            <p className="text-xs mt-1" style={{ color: "var(--ff-cyan)" }}>
              +8.2% {t("home.fromLastMonth")}
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
            <p className="ff-heading text-xl font-semibold">$3,840</p>
            <p className="text-xs mt-1" style={{ color: "var(--ff-expense)" }}>
              +4.1% {t("home.fromLastMonth")}
            </p>
          </div>
        </div>

        <div className="ff-card-lg p-4 mb-6">
          <h3 className="ff-heading font-semibold mb-4">{t("home.spendingOverview")}</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataLocalized}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#079697" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#079697" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="var(--ff-chart-axis)"
                  style={{ fontSize: "12px", fill: "var(--ff-chart-axis)" }}
                />
                <YAxis
                  stroke="var(--ff-chart-axis)"
                  style={{ fontSize: "12px", fill: "var(--ff-chart-axis)" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#079697"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="ff-heading font-semibold mb-4">{t("home.categories")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div key={cat.key} className="ff-card-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="ff-text text-sm">{t(`categories.${cat.key}`)}</p>
                  <p className="ff-text-muted text-xs">{cat.percent}%</p>
                </div>
                <p className="ff-heading font-semibold mb-2">${cat.amount}</p>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--ff-accent-highlight)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="ff-heading font-semibold mb-4">{t("home.recentTransactions")}</h3>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                className="ff-card-lg p-4 flex items-center gap-4"
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor:
                      transaction.amount > 0
                        ? "color-mix(in srgb, var(--ff-cyan) 20%, transparent)"
                        : "color-mix(in srgb, var(--ff-expense) 20%, transparent)",
                  }}
                >
                  {transaction.amount > 0 ? (
                    <ArrowDownRight className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" style={{ color: "var(--ff-expense)" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="ff-text font-medium">{transaction.name}</p>
                  <p className="ff-text-muted text-xs">
                    {t(`categories.${transaction.categoryKey}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-semibold"
                    style={{
                      color: transaction.amount > 0 ? "var(--ff-cyan)" : "var(--ff-text)",
                    }}
                  >
                    {transaction.amount > 0 ? "+" : ""}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="ff-text-muted text-xs">{formatDate(transaction)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
