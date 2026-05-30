import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import type { Goal } from "../../types";
import { GOAL_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from "../../utils/constants";
import { validateAmount, validateRequired } from "../../utils/validation";
import { AlertMessage, FormField } from "./shared/UiHelpers";

interface GoalFormModalProps {
  goal?: Goal | null;
  onClose: () => void;
}

export default function GoalFormModal({ goal, onClose }: GoalFormModalProps) {
  const { t } = useLanguage();
  const { addGoal, updateGoal } = useFinance();
  const isEditing = !!goal;

  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() ?? "");
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() ?? "0");
  const [deadline, setDeadline] = useState(
    goal?.deadline ?? new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]
  );
  const [category, setCategory] = useState(goal?.category ?? "savings");
  const [error, setError] = useState("");

  const handleSave = () => {
    const nameError = validateRequired(name, "validation.nameRequired");
    const targetError = validateAmount(targetAmount);
    const currentVal = parseFloat(currentAmount);
    if (nameError || targetError || isNaN(currentVal) || currentVal < 0) {
      setError(t(nameError ?? targetError ?? "validation.amountInvalid"));
      return;
    }

    const data = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentVal,
      deadline,
      category,
      icon: CATEGORY_ICONS[category] ?? "🎯",
      color: CATEGORY_COLORS[category] ?? "#079697",
    };

    if (isEditing && goal) {
      updateGoal(goal.id, data);
    } else {
      addGoal(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "var(--ff-overlay)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "var(--ff-gradient-page)",
          borderTop: "1px solid var(--ff-border)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="ff-heading text-xl">
              {isEditing ? t("goals.edit") : t("goals.create")}
            </h2>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full ff-card-interactive flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <FormField label={t("goals.form.name")}>
              <input value={name} onChange={(e) => setName(e.target.value)} className="ff-input px-4 py-3" />
            </FormField>

            <FormField label={t("goals.form.target")}>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="ff-input px-4 py-3"
                min="0"
              />
            </FormField>

            <FormField label={t("goals.form.current")}>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="ff-input px-4 py-3"
                min="0"
              />
            </FormField>

            <FormField label={t("goals.form.deadline")}>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="ff-input px-4 py-3"
              />
            </FormField>

            <FormField label={t("goals.form.category")}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ff-input px-4 py-3"
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`goalCategories.${cat}`)}
                  </option>
                ))}
              </select>
            </FormField>

            {error && <AlertMessage type="error" message={error} />}

            <motion.button
              type="button"
              onClick={handleSave}
              className="w-full ff-btn-primary py-4"
              whileTap={{ scale: 0.98 }}
            >
              {t("common.save")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
