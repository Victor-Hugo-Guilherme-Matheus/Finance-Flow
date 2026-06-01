import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, RefreshCw, ChevronDown, Search } from "lucide-react";
import { getCurrencies, convertCurrency } from "../../services/exchangeService";

const POPULAR_CURRENCIES = ["BRL", "USD", "EUR", "GBP", "JPY", "ARS", "CAD", "CHF"];

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  currencies: Record<string, string>;
  label: string;
}

function CurrencySelect({ value, onChange, currencies, label }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allCurrencies = [
    ...POPULAR_CURRENCIES.filter((c) => currencies[c]),
    ...Object.keys(currencies).filter((c) => !POPULAR_CURRENCIES.includes(c)).sort(),
  ];

  const filtered = allCurrencies.filter(
    (c) =>
      c.toLowerCase().includes(search.toLowerCase()) ||
      currencies[c]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 relative" ref={ref}>
      <label className="ff-text-muted text-xs mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full ff-input px-3 py-3 flex items-center justify-between gap-1"
      >
        <span className="ff-text text-sm font-semibold truncate">{value}</span>
        <ChevronDown className="w-4 h-4 ff-text-muted flex-shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 z-50 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              top: "calc(100% + 4px)",
              backgroundColor: "var(--ff-bg)",
              border: "1px solid var(--ff-border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="p-2 sticky top-0"
              style={{ backgroundColor: "var(--ff-bg)" }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ff-text-muted" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar moeda..."
                  className="ff-input pl-9 pr-3 py-2 text-sm w-full"
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
              {filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors"
                  style={{
                    backgroundColor:
                      c === value
                        ? "color-mix(in srgb, var(--ff-cyan) 20%, var(--ff-bg))"
                        : "transparent",
                    color: c === value ? "var(--ff-cyan)" : "var(--ff-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (c !== value)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "color-mix(in srgb, var(--ff-cyan) 8%, var(--ff-bg))";
                  }}
                  onMouseLeave={(e) => {
                    if (c !== value)
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span className="font-bold w-10 flex-shrink-0">{c}</span>
                  <span className="ff-text-muted text-xs truncate">{currencies[c]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CurrencyConverter() {
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("BRL");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrencies()
      .then(setCurrencies)
      .catch(() => setError("Erro ao carregar moedas."));
  }, []);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Digite um valor válido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const converted = await convertCurrency(from, to, parseFloat(amount));
      setResult(converted);
    } catch {
      setError("Erro ao converter. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
  };

  return (
    <div className="ff-card-lg p-6 space-y-4">
      <h3 className="ff-heading font-semibold text-lg">Conversor de Moedas</h3>

      <div>
        <label className="ff-text-muted text-xs mb-1 block">Valor</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setResult(null); }}
          className="ff-input px-4 py-3 text-xl font-semibold"
          placeholder="0.00"
          min="0"
        />
      </div>

      <div className="flex items-end gap-2">
        <CurrencySelect
          value={from}
          onChange={(v) => { setFrom(v); setResult(null); }}
          currencies={currencies}
          label="De"
        />

        <motion.button
          type="button"
          onClick={handleSwap}
          className="mb-0.5 w-10 h-10 rounded-full ff-card-interactive flex items-center justify-center flex-shrink-0"
          whileTap={{ scale: 0.9, rotate: 180 }}
        >
          <ArrowLeftRight className="w-4 h-4" style={{ color: "var(--ff-cyan)" }} />
        </motion.button>

        <CurrencySelect
          value={to}
          onChange={(v) => { setTo(v); setResult(null); }}
          currencies={currencies}
          label="Para"
        />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ff-gradient-banner p-4 rounded-2xl text-center"
        >
          <p className="text-sm opacity-80 mb-1">{amount} {from} =</p>
          <p className="text-3xl font-bold">{result} {to}</p>
        </motion.div>
      )}

      <motion.button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="w-full ff-btn-primary py-4 flex items-center justify-center gap-2"
        whileTap={{ scale: 0.98 }}
      >
        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Converter"}
      </motion.button>
    </div>
  );
}