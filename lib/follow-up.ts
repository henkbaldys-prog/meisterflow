import { formatDate } from "@/lib/utils";

/** WhatsApp/E-Mail-Text für Angebots-Nachfassen */
export function buildFollowUpMessage(kundenName: string): string {
  return `Hallo ${kundenName}, hatten Sie schon die Gelegenheit, unser Angebot zu prüfen? Bei Fragen stehe ich gerne zur Verfügung.`;
}

export function buildFollowUpEmailSubject(nummer?: string): string {
  return nummer
    ? `Noch Fragen zu Ihrem Angebot ${nummer}?`
    : "Noch Fragen zu Ihrem Angebot?";
}

/** Tage bis Fälligkeit (negativ = überfällig) */
export function daysUntilFaellig(faelligAm: string): number {
  const due = new Date(faelligAm);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatFollowUpFaelligLabel(faelligAm: string): string {
  const days = daysUntilFaellig(faelligAm);
  if (days < 0) return `Überfällig seit ${Math.abs(days)} Tag${Math.abs(days) === 1 ? "" : "en"}`;
  if (days === 0) return "Heute nachfassen";
  if (days === 1) return "Morgen nachfassen";
  return `In ${days} Tagen nachfassen`;
}

export function formatAngebotVom(createdAt?: string | null): string {
  if (!createdAt) return "";
  return `Angebot vom ${formatDate(createdAt)}`;
}
