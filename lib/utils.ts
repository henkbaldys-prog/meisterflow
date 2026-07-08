import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function generateAngebotsNummer(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AG-${year}-${random}`;
}

export function generateRechnungsNummer(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RE-${year}-${random}`;
}

export function calculateMwst(netto: number, mwstSatz: number = 19): number {
  return netto * (mwstSatz / 100);
}

export function calculateBrutto(netto: number, mwstSatz: number = 19): number {
  return netto + calculateMwst(netto, mwstSatz);
}
