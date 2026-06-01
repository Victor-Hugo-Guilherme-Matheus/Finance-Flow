import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target, TrendingUp, Calendar, Plus, Check, XCircle, Edit, Trash2, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import type { Goal } from "../../types";
import { formatCurrency, daysUntil } from "../../utils/format";
import { EmptyState, LoadingSpinner } from "./shared/UiHelpers";
import GoalFormModal from "./GoalFormModal";
import AchievementToast from "./AchievementToast";
import { checkAchievements, type Achievement } from "../../services/achievementService";

const GOAL_NAME_KEYS = ["emergencyFund", "vacationBali", "newLaptop", "investmentPortfolio"];

function getGoalDisplayName(name: string, t: (key: string) => string) {
  if (GOAL_NAME_KEYS.includes(name)) return t(`goals.${name}`);
  return name;
}

interface AddFundsModalProps {
  goal: Goal;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

function AddFundsModal({ goal, onClose, onConfirm }: AddFundsModalProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError("Digite um valor válido.");
      return;
    }
    onConfirm(value);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "var(--ff-overlay)" }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm ff-card-lg p-6 space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="ff-heading text-lg font-semibold">{t("goals.addFunds")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full ff-card-interactive flex items-center justify-center"
          >
            <X className="w-4 h-4 ff-text" />
          </button>
        </div>

        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <p className="ff-text text-sm font-medium">{getGoalDisplayName(goal.name, () => "")}</p>
            <p className="ff-text-muted text-xs">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>

        <div>
          <label className="ff-text-muted text-sm mb-2 block">{t("goals.addFundsPrompt")}</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            className="ff-input px-4 py-3 text-xl font-semibold w-full"
            placeholder="0.00"
            min="0"
            step="0.01"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button
            type="button"
            onClick={onClose}
            className="flex-1 ff-card-interactive py-3 rounded-2xl ff-text text-sm font-medium"
            whileTap={{ scale: 0.97 }}
          >
            {t("common.cancel")}
          </motion.button>
          <motion.button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ backgroundColor: goal.color }}
            whileTap={{ scale: 0.97 }}
          >
            {t("common.save")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FinancialGoalsScreen() {
  const { t } = useLanguage();
  const { goals, isLoading, updateGoal, deleteGoal } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "closed">("active");
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [lastAchievement, setLastAchievement] = useState<Achievement | null>(null);
  const achievementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevGoalsRef = useRef<Goal[]>(goals);

  const showAchievementNotification = (achievement: Achievement) => {
    if (achievementTimer.current) clearTimeout(achievementTimer.current);
    setCurrentAchievement(achievement);
    setLastAchievement(achievement);
    achievementTimer.current = setTimeout(() => setCurrentAchievement(null), 4000);
  };

  const triggerAchievements = (updatedGoal?: Goal) => {
  const unlocked = checkAchievements(prevGoalsRef.current, goals, updatedGoal);
  prevGoalsRef.current = [...goals];
  if (unlocked.length > 0) showAchievementNotification(unlocked[0]);
};

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const closedGoals = goals.filter((g) => g.status === "closed");

  const displayedGoals =
    activeTab === "active"
      ? activeGoals
      : activeTab === "completed"
        ? completedGoals
        : closedGoals;

  const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalProgress = totalTarget ? (totalCurrent / totalTarget) * 100 : 0;

  const handleAddFunds = (goal: Goal, amount: number) => {
    const newCurrent = goal.currentAmount + amount;
    const status = newCurrent >= goal.targetAmount ? "completed" : goal.status;
    const updatedGoal = { ...goal, currentAmount: newCurrent, status } as Goal;
    updateGoal(goal.id, { currentAmount: newCurrent, status });
    triggerAchievements(updatedGoal);
  };

  const handleComplete = (goal: Goal) => {
    const updatedGoal = { ...goal, status: "completed", currentAmount: goal.targetAmount } as Goal;
    updateGoal(goal.id, { status: "completed", currentAmount: goal.targetAmount });
    triggerAchievements(updatedGoal);
  };

  const handleClose = (goal: Goal) => {
    updateGoal(goal.id, { status: "closed" });
  };

  const handleDelete = (goal: Goal) => {
    if (window.confirm(t("goals.confirmDelete"))) deleteGoal(goal.id);
  };

  if (isLoading) {
    return (
      <div className="ff-page">
        <LoadingSpinner label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="ff-page">
      <AchievementToast
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="ff-heading text-2xl">{t("goals.title")}</h2>
            <p className="ff-text-muted text-sm">{t("goals.subtitle")}</p>
          </div>
          <motion.button
            type="button"
            onClick={() => {
              prevGoalsRef.current = goals;
              setEditingGoal(null);
              setShowForm(true);
            }}
            className="w-12 h-12 rounded-full ff-fab flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            aria-label={t("goals.create")}
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
              <p className="ff-heading text-xl font-bold">
                {formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}
              </p>
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
              animate={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
          <p className="text-sm" style={{ color: "var(--ff-cyan)" }}>
            {totalProgress.toFixed(1)}% {t("goals.complete")}
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(["active", "completed", "closed"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                activeTab === tab ? "ff-nav-active" : "ff-card-interactive"
              }`}
            >
              {t(`goals.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {displayedGoals.length === 0 ? (
          <EmptyState title={t(`goals.empty.${activeTab}`)} description={t("goals.emptyHint")} />
        ) : (
          <div className="space-y-4">
            {displayedGoals.map((goal, index) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              const days = daysUntil(goal.deadline);

              return (
                <motion.div
                  key={goal.id}
                  className="ff-card-lg p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="ff-heading font-semibold mb-1 truncate">
                        {getGoalDisplayName(goal.name, t)}
                      </h3>
                      <p className="ff-text-muted text-sm">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
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
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 ff-text-muted text-xs">
                      <TrendingUp className="w-4 h-4" />
                      <span>{t("goals.remaining", { amount: formatCurrency(Math.max(0, remaining)) })}</span>
                    </div>
                    <div className="flex items-center gap-2 ff-text-muted text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>{t("goals.daysLeft", { count: days })}</span>
                    </div>
                  </div>

                  {goal.history.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--ff-accent-highlight)" }}>
                      <p className="ff-text-muted text-xs mb-2">{t("goals.history")}</p>
                      {goal.history.slice(-3).map((h, i) => (
                        <p key={i} className="ff-text text-xs">
                          {formatCurrency(h.amount ?? 0)} — {h.action} — {h.date.split("T")[0]}
                        </p>
                      ))}
                    </div>
                  )}

                  {goal.status === "active" && (
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        type="button"
                        onClick={() => setAddFundsGoal(goal)}
                        className="py-2 rounded-xl border text-sm"
                        style={{ borderColor: "var(--ff-border-strong)", color: "var(--ff-cyan)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {t("goals.addFunds")}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowForm(true);
                        }}
                        className="py-2 rounded-xl border text-sm ff-card-interactive flex items-center justify-center gap-1"
                        whileTap={{ scale: 0.98 }}
                      >
                        <Edit className="w-3 h-3" />
                        {t("common.edit")}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleComplete(goal)}
                        className="py-2 rounded-xl text-sm flex items-center justify-center gap-1"
                        style={{ backgroundColor: "color-mix(in srgb, var(--ff-success) 15%, transparent)", color: "var(--ff-success)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Check className="w-3 h-3" />
                        {t("goals.markComplete")}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleClose(goal)}
                        className="py-2 rounded-xl text-sm flex items-center justify-center gap-1 ff-card-interactive"
                        whileTap={{ scale: 0.98 }}
                      >
                        <XCircle className="w-3 h-3" />
                        {t("goals.closeGoal")}
                      </motion.button>
                    </div>
                  )}

                  {(goal.status === "completed" || goal.status === "closed") && (
                    <button
                      type="button"
                      onClick={() => handleDelete(goal)}
                      className="w-full py-2 text-sm flex items-center justify-center gap-1 mt-2"
                      style={{ color: "var(--ff-expense)" }}
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("common.delete")}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Card fixo de conquista */}
        {goals.length > 0 && (
          <motion.div
            className="mt-6 mb-6 ff-card-lg p-5"
            style={{
              background: "linear-gradient(to bottom right, color-mix(in srgb, var(--ff-blue) 20%, var(--ff-surface)), color-mix(in srgb, var(--ff-cyan) 20%, var(--ff-surface)))",
              border: "1px solid color-mix(in srgb, var(--ff-cyan) 30%, transparent)",
            }}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={lastAchievement?.id ?? "default"}
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: "color-mix(in srgb, var(--ff-cyan) 20%, transparent)" }}
                >
                  {lastAchievement ? lastAchievement.icon : "🏆"}
                </div>
                <div>
                  {lastAchievement ? (
                    <>
                      <p className="ff-text-muted text-xs mb-1">🎉 Conquista desbloqueada!</p>
                      <p className="ff-heading font-semibold">{lastAchievement.title}</p>
                      <p className="ff-text-muted text-sm mt-1">{lastAchievement.description}</p>
                    </>
                  ) : (
                    <>
                      <p className="ff-heading font-semibold">{t("goals.achievementTitle")}</p>
                      <p className="ff-text-muted text-sm mt-1">{t("goals.achievementBody")}</p>
                      <span className="text-sm mt-2 block" style={{ color: "var(--ff-warning)" }}>
                        🥇 {t("goals.badge")}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <GoalFormModal
            goal={editingGoal}
            onClose={() => {
              setShowForm(false);
              setEditingGoal(null);
              triggerAchievements();
            }}
          />
        )}
        {addFundsGoal && (
          <AddFundsModal
            goal={addFundsGoal}
            onClose={() => setAddFundsGoal(null)}
            onConfirm={(amount) => handleAddFunds(addFundsGoal, amount)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}