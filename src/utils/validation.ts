import type { CardBrand, PaymentCard } from "../types";
import { MIN_PASSWORD_LENGTH } from "./constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (!password) return "validation.passwordRequired";
  if (password.length < MIN_PASSWORD_LENGTH) return "validation.passwordMin";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "validation.emailRequired";
  if (!isValidEmail(email)) return "validation.emailInvalid";
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (password !== confirmPassword) return "validation.passwordMismatch";
  return null;
}

export function validateRequired(value: string, key: string): string | null {
  if (!value.trim()) return key;
  return null;
}

export function validateAmount(value: string): string | null {
  const num = parseFloat(value);
  if (!value || isNaN(num) || num <= 0) return "validation.amountInvalid";
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "validation.phoneInvalid";
  return null;
}

export function detectCardBrand(number: string): string {
  const cleaned = number.replace(/\D/g, "");
  if (/^4/.test(cleaned)) return "visa";
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "mastercard";
  if (/^(636368|438935|504175|451416|636297)/.test(cleaned)) return "elo";
  if (/^3[47]/.test(cleaned)) return "amex";
  return "other";
}

/** Exibe o cartão mascarado a partir dos 4 últimos dígitos */
export function maskCardNumber(lastDigits: string, hidden = false): string {
  return hidden ? "•••• •••• •••• ••••" : `•••• •••• •••• ${lastDigits}`;
}

export function validateCardLastDigits(value: string): string | null {
  return /^\d{4}$/.test(value) ? null : "validation.cardLastDigitsInvalid";
}

export function validateCardExpiry(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match) return "validation.cardExpiryInvalid";
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? null : "validation.cardExpiryInvalid";
}

const CARD_BRANDS: CardBrand[] = ["visa", "mastercard", "elo", "amex", "other"];

/**
 * Converte qualquer cartão (inclusive no formato antigo, com número completo e CVV)
 * para o formato seguro, que guarda só os 4 últimos dígitos.
 */
export function toSafeCard(card: Record<string, unknown>): PaymentCard {
  const legacyNumber = typeof card.number === "string" ? card.number.replace(/\D/g, "") : "";
  const lastDigits =
    typeof card.lastDigits === "string" && card.lastDigits
      ? card.lastDigits.replace(/\D/g, "").slice(-4)
      : legacyNumber.slice(-4);
  const brand = CARD_BRANDS.includes(card.brand as CardBrand)
    ? (card.brand as CardBrand)
    : (detectCardBrand(legacyNumber) as CardBrand);

  return {
    id: String(card.id ?? ""),
    name: String(card.name ?? ""),
    lastDigits,
    expiry: String(card.expiry ?? ""),
    brand,
    holderName: String(card.holderName ?? ""),
    type: card.type === "debit" ? "debit" : "credit",
    isPrimary: Boolean(card.isPrimary),
    isHidden: Boolean(card.isHidden),
  };
}
