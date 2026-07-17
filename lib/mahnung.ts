import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Rechnung } from "@/types";

const UNPAID = new Set(["versendet", "ueberfaellig", "gemahnt"]);

export function isUnpaidRechnung(status: string): boolean {
  return UNPAID.has(status);
}

function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Überfällig: unbezahlt und faellig_am < heute */
export function isRechnungUeberfaellig(r: Pick<Rechnung, "status" | "faellig_am">, today = todayISO()): boolean {
  return isUnpaidRechnung(r.status) && r.faellig_am < today;
}

/** Fällig innerhalb der nächsten 14 Tage (inkl. heute), noch nicht überfällig */
export function isRechnungFaelligBald(
  r: Pick<Rechnung, "status" | "faellig_am">,
  today = todayISO(),
  withinDays = 14,
): boolean {
  if (!isUnpaidRechnung(r.status)) return false;
  if (r.faellig_am < today) return false;
  const limit = addDaysISO(today, withinDays);
  return r.faellig_am <= limit;
}

/** Mahnung jetzt sinnvoll? Überfällig / bald fällig, und bei gemahnt erst wenn naechste_mahnung_am erreicht */
export function needsMahnung(
  r: Pick<Rechnung, "status" | "faellig_am" | "naechste_mahnung_am">,
  today = todayISO(),
): boolean {
  if (!isUnpaidRechnung(r.status)) return false;

  if (r.status === "gemahnt") {
    if (!r.naechste_mahnung_am) return isRechnungUeberfaellig(r, today);
    return r.naechste_mahnung_am <= today;
  }

  return isRechnungUeberfaellig(r, today) || isRechnungFaelligBald(r, today);
}

export function daysUntilFaelligDate(faelligAm: string, today = todayISO()): number {
  const due = new Date(faelligAm + "T12:00:00");
  const now = new Date(today + "T12:00:00");
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildMahnungMessage(opts: {
  kundenName: string;
  nummer: string;
  brutto: number;
  faelligAm: string;
  mahnungstext: string;
  firmenname?: string;
}): string {
  const text =
    opts.mahnungstext?.trim() ||
    "Wir bitten höflich um Begleichung der offenen Forderung.";
  const firma = opts.firmenname?.trim() || "Ihr Handwerksbetrieb";

  return `Hallo ${opts.kundenName},

${text}

Rechnung ${opts.nummer} über ${formatCurrency(opts.brutto)} war fällig am ${formatDate(opts.faelligAm)}.

Mit freundlichen Grüßen
${firma}`;
}

export function buildMahnungSubject(nummer: string): string {
  return `Erinnerung zu Rechnung ${nummer}`;
}

/** Datum in 7 Tagen (YYYY-MM-DD) */
export function nextMahnungDate(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
