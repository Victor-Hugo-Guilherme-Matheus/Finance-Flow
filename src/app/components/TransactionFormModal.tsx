import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import type { Transaction, TransactionType } from "../../types";
import { validateAmount, validateRequired } from "../../utils/validation";
import { AlertMessage, FormField } from "./shared/UiHelpers";

const CATEGORIES = ["food", "transport", "shopping", "bills", "entertainment", "health", "income", "savings", "other"];
const PAYMENT_METHODS = ["creditCard", "debitCard", "cash", "digitalWallet"];

interface TransactionFormModalProps {
  transaction?: Transaction | null;
  defaultType?: TransactionType;
  onClose: () => void;
}

export default function TransactionFormModal({
  transaction,
  defaultType = "expense",
  onClose,
}: TransactionFormModalProps) {
  const { t } = useLanguage();
  const { addTransaction, updateTransaction } = useFinance();
  const isEditing = !!transaction;

  const [name, setName] = useState(transaction?.name ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? "");
  const [type, setType] = useState<TransactionType>(transaction?.type ?? defaultType);
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [date, setDate] = useState(
    transaction?.date ?? new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod ?? "");
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const nameError = validateRequired(name, "validation.nameRequired");
    const amountError = validateAmount(amount);
    const categoryError = !category ? "validation.categoryRequired" : null;

    if (nameError || amountError || categoryError) {
      setError(t(nameError ?? amountError ?? categoryError!));
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      amount: parseFloat(amount),
      type,
      category,
      date,
      paymentMethod: paymentMethod || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEditing && transaction) {
      updateTransaction(transaction.id, data);
    } else {
      addTransaction(data);
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
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
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
              {isEditing ? t("transactions.edit") : t("transactions.add")}
            </h2>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full ff-card-interactive flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <FormField label={t("transactions.form.type")}>
              <div className="flex gap-2">
                {(["income", "expense", "transfer"] as TransactionType[]).map((tType) => (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => setType(tType)}
                    className={`flex-1 py-2 rounded-xl text-sm ${
                      type === tType ? "ff-nav-active" : "ff-card-interactive"
                    }`}
                  >
                    {t(`transactions.type.${tType}`)}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label={t("transactions.form.name")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ff-input px-4 py-3"
                placeholder={t("transactions.form.namePlaceholder")}
              />
            </FormField>

            <FormField label={t("transactions.form.amount")}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="ff-input px-4 py-3"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </FormField>

            <FormField label={t("transactions.form.category")}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ff-input px-4 py-3"
              >
                <option value="">{t("transactions.form.selectCategory")}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t("transactions.form.date")}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ff-input px-4 py-3"
              />
            </FormField>

            <FormField label={t("transactions.form.description")}>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ff-input px-4 py-3"
              />
            </FormField>

            <FormField label={t("addExpense.paymentMethod")}>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="ff-input px-4 py-3"
              >
                <option value="">{t("transactions.form.optional")}</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`payment.${m}`)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t("transactions.form.notes")}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ff-input px-4 py-3 min-h-[80px] resize-none"
                rows={3}
              />
            </FormField>

            {error && <AlertMessage type="error" message={error} />}

            <motion.button
              type="button"
              onClick={handleSave}
              className="w-full ff-btn-primary py-4"
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
