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

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isWithinLast30Days(dateStr: string): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return d >= cutoff;
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Absolute Tracking-URL für Kunden (funktioniert auf Handy ohne Login). */
export function getAngebotTrackUrl(angebotId: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  return `${base}/api/angebote/track/${angebotId}`;
}

/** z.B. "Geöffnet vor 2 Stunden" / "Noch nicht geöffnet" */
export function formatGelesenStatus(gelesenAm: string | null | undefined): {
  label: string;
  opened: boolean;
} {
  if (!gelesenAm) {
    return { label: "Noch nicht geöffnet", opened: false };
  }

  const openedAt = new Date(gelesenAm).getTime();
  const diffMs = Date.now() - openedAt;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  let relative: string;
  if (minutes < 1) relative = "gerade eben";
  else if (minutes < 60) relative = `vor ${minutes} Minute${minutes === 1 ? "" : "n"}`;
  else if (hours < 24) relative = `vor ${hours} Stunde${hours === 1 ? "" : "n"}`;
  else relative = `vor ${days} Tag${days === 1 ? "" : "en"}`;

  return { label: `Geöffnet ${relative}`, opened: true };
}
