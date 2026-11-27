/** Utilitários de formatação */

/**
 * Datas "AAAA-MM-DD" são lidas no fuso local. `new Date("2026-12-01")` seria
 * meia-noite em UTC, ou seja, 30/11 às 21h no horário de Brasília.
 */
export function parseLocalDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(dateStr);
}

/** Data de hoje no fuso local, no formato "AAAA-MM-DD" */
export function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatCurrency(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateStr: string, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseLocalDate(dateStr));
}

export function formatRelativeDate(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("dates.today");
  if (diffDays === 1) return t("dates.yesterday");
  if (diffDays > 1 && diffDays <= 7) return t("dates.daysAgo", { count: diffDays });
  return formatDate(dateStr);
}

/** Rótulo do dia para cabeçalhos de lista: "Hoje", "Ontem", "segunda, 24 de nov." */
export function formatDayLabel(
  dateStr: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale = "pt-BR"
): string {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return t("dates.today");
  if (diffDays === 1) return t("dates.yesterday");
  const sameYear = date.getFullYear() === today.getFullYear();
  const label = new Intl.DateTimeFormat(locale, {
    weekday: diffDays < 7 && diffDays > 0 ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isSameMonth(dateStr: string, reference = new Date()): boolean {
  const date = parseLocalDate(dateStr);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth()
  );
}

export function daysUntil(dateStr: string): number {
  const target = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}
