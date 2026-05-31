import { useState } from "react";
import { motion } from "motion/react";
import { X, DollarSign, Calendar, CreditCard, Tag } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import { validateAmount, validateRequired } from "../../utils/validation";
import { AlertMessage, FormField } from "./shared/UiHelpers";

interface AddExpenseScreenProps {
  onClose: () => void;
}

const categories = [
  { key: "food", icon: "🍔", color: "#079697" },
  { key: "transport", icon: "🚗", color: "#5b6bf5" },
  { key: "shopping", icon: "🛍️", color: "#00d4aa" },
  { key: "bills", icon: "💡", color: "#ff6b9d" },
  { key: "entertainment", icon: "🎬", color: "#ffd93d" },
  { key: "health", icon: "⚕️", color: "#ff6348" },
] as const;

const paymentMethods = [
  { key: "creditCard", icon: "💳" },
  { key: "debitCard", icon: "🏦" },
  { key: "cash", icon: "💵" },
  { key: "digitalWallet", icon: "📱" },
] as const;

/** Tela legada de despesa — persiste via FinanceContext */
export default function AddExpenseScreen({ onClose }: AddExpenseScreenProps) {
  const { t } = useLanguage();
  const { addTransaction } = useFinance();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const handleSave = () => {
    const nameError = validateRequired(name || "Despesa", "validation.nameRequired");
    const amountError = validateAmount(amount);
    if (!selectedCategory) {
      setError(t("validation.categoryRequired"));
      return;
    }
    if (nameError || amountError) {
      setError(t(nameError ?? amountError!));
      return;
    }

    addTransaction({
      name: name || t("addExpense.title"),
      amount: parseFloat(amount),
      type: "expense",
      category: selectedCategory,
      date,
      paymentMethod: selectedPayment || undefined,
    });
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
        transition={{ type: "spring", damping: 25 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="ff-heading text-2xl">{t("addExpense.title")}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full ff-card-interactive flex items-center justify-center"
            >
              <X className="w-5 h-5 ff-text" />
            </button>
          </div>

          <div className="space-y-6">
            <FormField label={t("transactions.form.name")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("transactions.form.namePlaceholder")}
                className="ff-input px-4 py-4"
              />
            </FormField>

            <FormField label={t("addExpense.amount")}>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <DollarSign className="w-5 h-5" style={{ color: "var(--ff-cyan)" }} />
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="ff-input px-12 py-4 text-2xl font-semibold"
                />
              </div>
            </FormField>

            <div>
              <label className="ff-text-muted text-sm mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {t("addExpense.category")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`p-4 rounded-2xl border transition-all ${
                      selectedCategory === cat.key ? "ff-card-lg" : "ff-card-interactive"
                    }`}
                    style={
                      selectedCategory === cat.key
                        ? {
                            borderColor: "var(--ff-cyan)",
                            backgroundColor:
                              "color-mix(in srgb, var(--ff-cyan) 15%, var(--ff-surface))",
                          }
                        : undefined
                    }
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <p className="ff-text text-xs">{t(`categories.${cat.key}`)}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="ff-text-muted text-sm mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t("addExpense.paymentMethod")}
              </label>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <motion.button
                    key={method.key}
                    type="button"
                    onClick={() => setSelectedPayment(method.key)}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition-all ${
                      selectedPayment === method.key ? "ff-card-lg" : "ff-card-interactive"
                    }`}
                    style={
                      selectedPayment === method.key
                        ? {
                            borderColor: "var(--ff-cyan)",
                            backgroundColor:
                              "color-mix(in srgb, var(--ff-cyan) 15%, var(--ff-surface))",
                          }
                        : undefined
                    }
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="ff-text">{t(`payment.${method.key}`)}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <FormField label={t("addExpense.date")}>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ff-text-faint" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="ff-input px-12 py-4"
                />
              </div>
            </FormField>

            {error && <AlertMessage type="error" message={error} />}

            <motion.button
              onClick={handleSave}
              className="w-full ff-btn-primary px-6 py-4"
              whileTap={{ scale: 0.98 }}
            >
              {t("addExpense.save")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
