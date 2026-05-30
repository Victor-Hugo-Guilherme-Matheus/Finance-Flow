import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, Inbox } from "lucide-react";

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
  label: string;
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
