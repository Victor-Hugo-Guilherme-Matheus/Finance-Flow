import { useState, useRef, useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle, Inbox, ChevronDown } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "inbox" | "alert";
}
export function EmptyState({ title, description, icon = "inbox" }: EmptyStateProps) {
  const Icon = icon === "alert" ? AlertCircle : Inbox;
  return (
    <div className="ff-card-lg p-8 text-center" role="status">
      <Icon className="w-12 h-12 mx-auto mb-4 ff-text-faint" aria-hidden="true" />
      <p className="ff-heading font-semibold mb-2">{title}</p>
      {description && <p className="ff-text-muted text-sm">{description}</p>}
    </div>
  );
}

interface AlertMessageProps {
  type: "error" | "success";
  message: string;
}
export function AlertMessage({ type, message }: AlertMessageProps) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle;
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl text-sm"
      role="alert"
      style={{
        backgroundColor: isError
          ? "color-mix(in srgb, var(--ff-expense) 15%, transparent)"
          : "color-mix(in srgb, var(--ff-success) 15%, transparent)",
        color: isError ? "var(--ff-expense)" : "var(--ff-success)",
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

interface LoadingSpinnerProps {
  label?: string;
}
export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--ff-cyan)", borderTopColor: "transparent" }}
      />
      {label && <p className="ff-text-muted text-sm mt-4">{label}</p>}
    </div>
  );
}

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}
export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        type="button"
        onClick={onBack}
        className="ff-text text-sm"
        style={{ color: "var(--ff-cyan)" }}
        aria-label="Voltar"
      >
        ←
      </button>
      <h2 className="ff-heading text-xl flex-1">{title}</h2>
    </div>
  );
}

interface FormFieldProps {
  label: ReactNode;
  error?: string;
  children: ReactNode;
}
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="ff-text-muted text-sm mb-2 block">{label}</label>
      {children}
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--ff-expense)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  hasError?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Selecione...", hasError }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ff-input px-4 py-3 w-full flex items-center justify-between gap-2 text-left"
        style={hasError ? { border: "1px solid var(--ff-expense)" } : undefined}
      >
        <span className={selected ? "ff-text text-sm" : "ff-text-muted text-sm"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 ff-text-muted flex-shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            bottom: "calc(100% + 4px)",
            backgroundColor: "var(--ff-bg)",
            border: "1px solid var(--ff-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {placeholder && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm ff-text-muted transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--ff-cyan) 8%, var(--ff-bg))")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm transition-colors"
              style={{
                backgroundColor: opt.value === value
                  ? "color-mix(in srgb, var(--ff-cyan) 20%, var(--ff-bg))"
                  : "transparent",
                color: opt.value === value ? "var(--ff-cyan)" : "var(--ff-text)",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "color-mix(in srgb, var(--ff-cyan) 8%, var(--ff-bg))";
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}