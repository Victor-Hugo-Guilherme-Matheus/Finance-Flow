import type { Transaction } from "../../../types";
import { formatCurrency } from "../../../utils/format";
import {
  getAmountColor,
  getAmountSign,
  getCategoryColor,
  getCategoryIcon,
} from "../../../utils/categoryIcons";
import { useLanguage } from "../../../i18n/LanguageContext";

interface TransactionRowProps {
  transaction: Transaction;
  onSelect?: (transaction: Transaction) => void;
  /** Texto à direita, abaixo do valor (ex.: "Ontem" na tela inicial) */
  meta?: string;
}

/** Uma linha de transação dentro de um grupo (.ff-group) */
export function TransactionRow({ transaction: tx, onSelect, meta }: TransactionRowProps) {
  const { t } = useLanguage();
  const Icon = getCategoryIcon(tx.category, tx.type);
  const detail = [
    t(`categories.${tx.category}`),
    tx.paymentMethod ? t(`payment.${tx.paymentMethod}`) : null,
  ]
    .filter((part) => part && !part.startsWith("payment."))
    .join(", ");

  const content = (
    <>
      <span
        className="ff-cat-icon"
        style={{ ["--ff-cat" as string]: getCategoryColor(tx.category) }}
        aria-hidden="true"
      >
        <Icon className="w-[1.15rem] h-[1.15rem]" strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block ff-text font-medium truncate">{tx.name}</span>
        <span className="block ff-text-muted text-xs truncate mt-0.5">{detail}</span>
      </span>
      <span className="text-right flex-shrink-0">
        <span
          className="block ff-num font-semibold text-[0.95rem]"
          style={{ color: getAmountColor(tx.type) }}
        >
          {getAmountSign(tx.type)}
          {formatCurrency(tx.amount)}
        </span>
        {meta && <span className="block ff-text-faint text-xs mt-0.5">{meta}</span>}
      </span>
    </>
  );

  if (!onSelect) return <div className="ff-row">{content}</div>;
  return (
    <button type="button" className="ff-row" onClick={() => onSelect(tx)}>
      {content}
    </button>
  );
}
