import type { Firmenprofil } from "@/types";

/** Fortlaufende GoBD-Rechnungsnummer: Präfix + Jahr + Nummer */
export function formatRechnungsnummer(
  prefix: string | null | undefined,
  nummer: number,
  year = new Date().getFullYear(),
): string {
  const p = (prefix || "RE-").replace(/-+$/, "-");
  const n = String(Math.max(1, nummer)).padStart(3, "0");
  // Wenn Präfix schon Jahr enthält, nicht doppelt
  if (/\d{4}/.test(p)) {
    return `${p}${n}`;
  }
  return `${p}${year}-${n}`;
}

export function nextRechnungsnummerFromProfil(profil: Firmenprofil | null): {
  nummer: string;
  nextCounter: number;
} {
  const counter = Math.max(1, Number(profil?.naechste_rechnungsnummer) || 1);
  return {
    nummer: formatRechnungsnummer(profil?.rechnungsnummer_prefix, counter),
    nextCounter: counter + 1,
  };
}
