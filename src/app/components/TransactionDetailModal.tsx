import { motion } from "motion/react";
import { X, Edit, Trash2, History } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { Transaction } from "../../types";
import { formatCurrency, formatDate } from "../../utils/format";

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailModalProps) {
  const { t } = useLanguage();

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
        className="relative w-full max-w-md rounded-t-3xl overflow-hidden max-h-[85vh] overflow-y-auto"
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
            <h2 className="ff-heading text-xl">{t("transactions.details")}</h2>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full ff-card-interactive flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <p
              className="text-3xl font-bold"
              style={{
                color: transaction.type === "income" ? "var(--ff-cyan)" : "var(--ff-text)",
              }}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </p>
            <p className="ff-heading text-lg mt-2">{transaction.name}</p>
            <p className="ff-text-muted text-sm">
              {t(`transactions.type.${transaction.type}`)} · {t(`categories.${transaction.category}`)}
            </p>
          </div>

          <div className="ff-card-lg p-4 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="ff-text-muted text-sm">{t("transactions.form.date")}</span>
              <span className="ff-text text-sm">{formatDate(transaction.date)}</span>
            </div>
            {transaction.description && (
              <div className="flex justify-between gap-4">
                <span className="ff-text-muted text-sm">{t("transactions.form.description")}</span>
                <span className="ff-text text-sm text-right">{transaction.description}</span>
              </div>
            )}
            {transaction.paymentMethod && (
              <div className="flex justify-between">
                <span className="ff-text-muted text-sm">{t("addExpense.paymentMethod")}</span>
                <span className="ff-text text-sm">{t(`payment.${transaction.paymentMethod}`)}</span>
              </div>
            )}
            {transaction.notes && (
              <div>
                <span className="ff-text-muted text-sm block mb-1">{t("transactions.form.notes")}</span>
                <p className="ff-text text-sm">{transaction.notes}</p>
              </div>
            )}
          </div>

          {/* Histórico da transação */}
          {transaction.history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 ff-text-muted" />
                <h3 className="ff-heading font-semibold text-sm">{t("transactions.history")}</h3>
              </div>
              <div className="space-y-2">
                {transaction.history.map((entry, i) => (
                  <div key={i} className="ff-card-interactive p-3 flex justify-between text-sm">
                    <span className="ff-text-muted">
                      {entry.action === "created" || entry.action === "updated"
                        ? t(`transactions.historyActions.${entry.action}`)
                        : entry.action}
                    </span>
                    <span className="ff-text-faint text-xs">{formatDate(entry.date.split("T")[0])}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={onEdit}
              className="ff-card-interactive py-3 flex items-center justify-center gap-2"
              style={{ color: "var(--ff-cyan)" }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit className="w-4 h-4" />
              {t("common.edit")}
            </motion.button>
            <motion.button
              type="button"
              onClick={onDelete}
              className="ff-card-interactive py-3 flex items-center justify-center gap-2"
              style={{ color: "var(--ff-expense)" }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
