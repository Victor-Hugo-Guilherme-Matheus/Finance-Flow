import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFinance } from "../../context/FinanceContext";
import type { Transaction, TransactionType } from "../../types";
import { formatCurrency, formatDayLabel } from "../../utils/format";
import { EmptyState, LoadingSpinner } from "./shared/UiHelpers";
import { ScreenHeader } from "./shared/ScreenHeader";
import { TransactionRow } from "./shared/TransactionRow";
import TransactionFormModal from "./TransactionFormModal";
import TransactionDetailModal from "./TransactionDetailModal";

type FilterType = "all" | TransactionType;

export default function TransactionsScreen() {
  const { t } = useLanguage();
  const { transactions, isLoading, deleteTransaction } = useFinance();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriodStart, setFilterPeriodStart] = useState("");
  const [filterPeriodEnd, setFilterPeriodEnd] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const categories = useMemo(() => {
    const keys = new Set(transactions.map((tx) => tx.category));
    return Array.from(keys);
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        tx.name.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        (tx.description?.toLowerCase().includes(searchLower) ?? false) ||
        (tx.notes?.toLowerCase().includes(searchLower) ?? false);

      const matchesType = filterType === "all" || tx.type === filterType;
      const matchesCategory = filterCategory === "all" || tx.category === filterCategory;
      const matchesStart = !filterPeriodStart || tx.date >= filterPeriodStart;
      const matchesEnd = !filterPeriodEnd || tx.date <= filterPeriodEnd;
      const min = filterMinAmount ? parseFloat(filterMinAmount) : null;
      const max = filterMaxAmount ? parseFloat(filterMaxAmount) : null;
      const matchesMin = min === null || tx.amount >= min;
      const matchesMax = max === null || tx.amount <= max;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesStart &&
        matchesEnd &&
        matchesMin &&
        matchesMax
      );
    });
  }, [
    transactions,
    search,
    filterType,
    filterCategory,
    filterPeriodStart,
    filterPeriodEnd,
    filterMinAmount,
    filterMaxAmount,
  ]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const key = tx.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txs]) => ({
        date,
        txs,
        // saldo do dia (transferências não entram)
        net: txs.reduce(
          (sum, tx) =>
            tx.type === "income" ? sum + tx.amount : tx.type === "expense" ? sum - tx.amount : sum,
          0
        ),
      }));
  }, [filtered]);

  const activeFilterCount = [
    filterCategory !== "all",
    filterPeriodStart,
    filterPeriodEnd,
    filterMinAmount,
    filterMaxAmount,
  ].filter(Boolean).length;

  const handleDelete = (id: string) => {
    if (window.confirm(t("transactions.confirmDelete"))) {
      deleteTransaction(id);
      setSelectedTx(null);
    }
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
      <div className="p-6">
        <ScreenHeader
          title={t("nav.transactions")}
          subtitle={t("transactions.subtitle")}
          action={
            <motion.button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setShowForm(true);
              }}
              className="w-11 h-11 rounded-full ff-fab flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              aria-label={t("transactions.add")}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          }
        />

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ff-text-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("transactions.searchPlaceholder")}
            className="ff-input pl-12 py-3"
            aria-label={t("transactions.searchPlaceholder")}
          />
        </div>

        {/* Filtros por tipo */}
        <div className="ff-scroll-x mb-4 py-0.5" role="toolbar" aria-label={t("transactions.filters")}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`px-3.5 py-2 rounded-full text-sm flex items-center gap-1.5 whitespace-nowrap ${
              showFilters || activeFilterCount ? "ff-nav-active" : "ff-card-interactive"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            {t("transactions.filters")}
            {activeFilterCount > 0 && (
              <span className="ff-num text-[0.7rem] min-w-4 h-4 px-1 rounded-full grid place-items-center ff-fab">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(["all", "income", "expense", "transfer"] as FilterType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              aria-pressed={filterType === type}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                filterType === type ? "ff-nav-active" : "ff-card-interactive"
              }`}
            >
              {t(`transactions.type.${type}`)}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ff-card-lg p-4 mb-4 space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ff-text-muted text-xs">{t("transactions.periodStart")}</label>
                  <input
                    type="date"
                    value={filterPeriodStart}
                    onChange={(e) => setFilterPeriodStart(e.target.value)}
                    className="ff-input px-3 py-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="ff-text-muted text-xs">{t("transactions.periodEnd")}</label>
                  <input
                    type="date"
                    value={filterPeriodEnd}
                    onChange={(e) => setFilterPeriodEnd(e.target.value)}
                    className="ff-input px-3 py-2 text-sm mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="ff-text-muted text-xs">{t("transactions.category")}</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="ff-input px-3 py-2 text-sm mt-1"
                >
                  <option value="all">{t("transactions.allCategories")}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ff-text-muted text-xs">{t("transactions.minAmount")}</label>
                  <input
                    type="number"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="ff-input px-3 py-2 text-sm mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="ff-text-muted text-xs">{t("transactions.maxAmount")}</label>
                  <input
                    type="number"
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                    className="ff-input px-3 py-2 text-sm mt-1"
                    placeholder="9999"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterPeriodStart("");
                  setFilterPeriodEnd("");
                  setFilterMinAmount("");
                  setFilterMaxAmount("");
                }}
                className="text-sm w-full py-2"
                style={{ color: "var(--ff-cyan)" }}
              >
                {t("transactions.clearFilters")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listagem */}
        {filtered.length === 0 ? (
          <EmptyState title={t("transactions.empty")} description={t("transactions.emptyHint")} />
        ) : (
          <div className="space-y-2">
            {grouped.map(({ date, txs, net }) => (
              <section key={date} aria-label={formatDayLabel(date, t)}>
                <div className="ff-day-header">
                  <h2 className="ff-text-muted text-sm font-medium">{formatDayLabel(date, t)}</h2>
                  {net !== 0 && (
                    <span className="ff-num ff-text-faint text-xs">
                      {net > 0 ? "+" : "−"}
                      {formatCurrency(Math.abs(net))}
                    </span>
                  )}
                </div>
                <div className="ff-group">
                  {txs.map((tx) => (
                    <TransactionRow key={tx.id} transaction={tx} onSelect={setSelectedTx} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <TransactionFormModal
            transaction={editingTx}
            onClose={() => {
              setShowForm(false);
              setEditingTx(null);
            }}
          />
        )}
        {selectedTx && (
          <TransactionDetailModal
            transaction={selectedTx}
            onClose={() => setSelectedTx(null)}
            onEdit={() => {
              setEditingTx(selectedTx);
              setSelectedTx(null);
              setShowForm(true);
            }}
            onDelete={() => handleDelete(selectedTx.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
