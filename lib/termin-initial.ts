import { SpracheTerminData, TerminInitialData } from "@/types";
import { todayISO } from "@/lib/utils";

function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function resolveDatum(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";

  const lower = raw.trim().toLowerCase();
  const today = new Date();

  if (lower === "heute") return todayISO();
  if (lower === "morgen") return addDaysISO(today, 1);
  if (lower === "übermorgen" || lower === "uebermorgen") return addDaysISO(today, 2);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();

  const deMatch = raw.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);
  if (deMatch) {
    const day = deMatch[1].padStart(2, "0");
    const month = deMatch[2].padStart(2, "0");
    const year = deMatch[3]
      ? deMatch[3].length === 2
        ? `20${deMatch[3]}`
        : deMatch[3]
      : String(today.getFullYear());
    return `${year}-${month}-${day}`;
  }

  return "";
}

export function resolveTime(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";

  const trimmed = raw.trim().toLowerCase().replace(" uhr", "");
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }

  const hourOnly = trimmed.match(/^(\d{1,2})$/);
  if (hourOnly) return `${hourOnly[1].padStart(2, "0")}:00`;

  return "";
}

function defaultEndTime(start: string): string {
  if (!start) return "";
  const [h, m] = start.split(":").map(Number);
  const endH = (h + 1) % 24;
  return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function spracheToTerminInitialData(data: SpracheTerminData): TerminInitialData {
  const uhrzeit_von = resolveTime(data.uhrzeit_von);
  const uhrzeit_bis = resolveTime(data.uhrzeit_bis) || defaultEndTime(uhrzeit_von);

  return {
    kunde_name: data.kunde_name,
    titel: data.titel || data.zusammenfassung,
    datum: resolveDatum(data.datum),
    uhrzeit_von,
    uhrzeit_bis,
    ort: data.ort || "",
    beschreibung: data.notizen || data.zusammenfassung || "",
  };
}
