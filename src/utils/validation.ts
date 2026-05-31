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

export function maskCardNumber(number: string): string {
  const cleaned = number.replace(/\D/g, "");
  return `**** **** **** ${cleaned.slice(-4)}`;
}
