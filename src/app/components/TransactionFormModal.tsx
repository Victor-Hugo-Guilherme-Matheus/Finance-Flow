import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import type { Transaction, TransactionType } from "../../types";
import { AlertMessage, FormField, CustomSelect } from "./shared/UiHelpers";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: t(`categories.${cat}`),
  }));

  const paymentOptions = PAYMENT_METHODS.map((m) => ({
    value: m,
    label: t(`payment.${m}`),
  }));

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valor deve ser maior que zero";
    if (!category) newErrors.category = "Selecione uma categoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

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

    try {
      if (isEditing && transaction) {
        await updateTransaction(transaction.id, data);
      } else {
        await addTransaction(data);
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar transação:", err);
      setErrors({ name: "Erro ao salvar. Tente novamente." });
    }
  };

  const inputClass = (field: string) =>
    `ff-input px-4 py-3 ${errors[field] ? "border border-red-400" : ""}`;

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

            <FormField label={<span>{t("transactions.form.name")} <span className="text-red-400">*</span></span>}>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                className={inputClass("name")}
                placeholder={t("transactions.form.namePlaceholder")}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </FormField>

            <FormField label={<span>{t("transactions.form.amount")} <span className="text-red-400">*</span></span>}>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
                className={inputClass("amount")}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
            </FormField>

            <FormField label={<span>{t("transactions.form.category")} <span className="text-red-400">*</span></span>}>
              <CustomSelect
                value={category}
                onChange={(v) => { setCategory(v); setErrors((p) => ({ ...p, category: "" })); }}
                options={categoryOptions}
                placeholder={t("transactions.form.selectCategory")}
                hasError={!!errors.category}
              />
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </FormField>

            <FormField label={t("transactions.form.date")}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ff-input px-4 py-3"
              />
            </FormField>

            <FormField label={`${t("transactions.form.description")} (opcional)`}>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ff-input px-4 py-3"
              />
            </FormField>

            <FormField label={`${t("addExpense.paymentMethod")} (opcional)`}>
              <CustomSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={paymentOptions}
                placeholder={t("transactions.form.optional")}
              />
            </FormField>

            <FormField label={`${t("transactions.form.notes")} (opcional)`}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ff-input px-4 py-3 min-h-[80px] resize-none"
                rows={3}
              />
            </FormField>

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