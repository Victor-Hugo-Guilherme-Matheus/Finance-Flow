import {
  ArrowLeftRight,
  Car,
  Clapperboard,
  HeartPulse,
  Landmark,
  Package,
  ReceiptText,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { TransactionType } from "../types";
import { CATEGORY_COLORS } from "./constants";

/** Ícone de cada categoria (mesmo traço do resto da interface, sem emojis) */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  shopping: ShoppingBag,
  bills: ReceiptText,
  entertainment: Clapperboard,
  health: HeartPulse,
  income: Wallet,
  savings: Landmark,
  transfer: ArrowLeftRight,
  other: Package,
};

export function getCategoryIcon(category: string, type?: TransactionType): LucideIcon {
  if (type === "transfer" && !CATEGORY_ICON[category]) return ArrowLeftRight;
  return CATEGORY_ICON[category] ?? Package;
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

/** Cor do valor: receita em verde, transferência em azul, despesa no tom do texto */
export function getAmountColor(type: TransactionType): string {
  if (type === "income") return "var(--ff-success)";
  if (type === "transfer") return "var(--ff-blue)";
  return "var(--ff-text)";
}

/** Sinal do valor. Usa o sinal de menos tipográfico (−), mais legível que o hífen */
export function getAmountSign(type: TransactionType): string {
  if (type === "income") return "+";
  if (type === "transfer") return "";
  return "−";
}
