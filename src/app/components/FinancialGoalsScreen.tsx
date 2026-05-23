import { motion } from "motion/react";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const goals = [
  {
    id: 1,
    nameKey: "emergencyFund",
    target: 10000,
    current: 6500,
    icon: "🎯",
    color: "#079697",
    daysLeft: 45,
  },
  {
    id: 2,
    nameKey: "vacationBali",
    target: 5000,
    current: 3200,
    icon: "✈️",
    color: "#5b6bf5",
    daysLeft: 90,
  },
  {
    id: 3,
    nameKey: "newLaptop",
    target: 2500,
    current: 1800,
    icon: "💻",
    color: "#00d4aa",
    daysLeft: 30,
  },
  {
    id: 4,
    nameKey: "investmentPortfolio",
    target: 15000,
    current: 4200,
    icon: "📈",
    color: "#ff6b9d",
    daysLeft: 180,
  },
] as const;

export default function FinancialGoalsScreen() {
  const { t } = useLanguage();

  return (
    <div className="ff-page">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="ff-heading text-2xl">{t("goals.title")}</h2>
            <p className="ff-text-muted text-sm">{t("goals.subtitle")}</p>
          </div>
          <motion.button
            className="w-12 h-12 rounded-full ff-fab flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="ff-card-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full ff-icon-chip flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="ff-text-muted text-sm">{t("goals.totalProgress")}</p>
              <p className="ff-heading text-xl font-bold">$15,700 / $32,500</p>
            </div>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden mb-2"
            style={{ backgroundColor: "var(--ff-accent-highlight)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--ff-gradient-card)" }}
              initial={{ width: 0 }}
              animate={{ width: "48.3%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm" style={{ color: "var(--ff-cyan)" }}>
            48.3% {t("goals.complete")}
          </p>
        </div>

        <div className="space-y-4">
          {goals.map((goal, index) => {
            const progress = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;

            return (
              <motion.div
                key={goal.id}
                className="ff-card-lg p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="ff-heading font-semibold mb-1">
                      {t(`goals.${goal.nameKey}`)}
                    </h3>
                    <p className="ff-text-muted text-sm">
                      ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="ff-heading font-semibold">{progress.toFixed(1)}%</p>
                    <p className="ff-text-muted text-xs">{t("goals.complete")}</p>
                  </div>
                </div>

                <div
                  className="w-full h-2.5 rounded-full overflow-hidden mb-4"
                  style={{ backgroundColor: "var(--ff-accent-highlight)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 ff-text-muted text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {t("goals.remaining", {
                        amount: `$${remaining.toLocaleString()}`,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ff-text-muted text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>{t("goals.daysLeft", { count: goal.daysLeft })}</span>
                  </div>
                </div>

                <motion.button
                  className="w-full mt-4 py-3 rounded-xl border transition-all"
                  style={{
                    borderColor: "var(--ff-border-strong)",
                    color: "var(--ff-cyan)",
                  }}
                  whileHover={{
                    backgroundColor: "color-mix(in srgb, var(--ff-cyan) 10%, transparent)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t("goals.addFunds")}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <div
          className="mt-6 ff-card-lg p-6"
          style={{
            background:
              "linear-gradient(to bottom right, color-mix(in srgb, var(--ff-blue) 20%, var(--ff-surface)), color-mix(in srgb, var(--ff-cyan) 20%, var(--ff-surface)))",
            borderColor: "var(--ff-border-strong)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--ff-accent-surface)" }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
            </div>
            <h3 className="ff-heading font-semibold">{t("goals.achievementTitle")}</h3>
          </div>
          <p className="ff-text-muted text-sm mb-4">{t("goals.achievementBody")}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span style={{ color: "var(--ff-warning)" }}>{t("goals.badge")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
