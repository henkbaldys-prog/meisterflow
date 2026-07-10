import { Kunde } from "@/types";

/** Anzeigename: bevorzugt Ansprechpartner/Name, sonst Firma */
export function getKundeName(k: Pick<Kunde, "ansprechpartner" | "firma">): string {
  const name = k.ansprechpartner?.trim();
  if (name) return name;
  return k.firma?.trim() || "Unbekannt";
}

/** Label für Dropdowns: „Max Müller“ oder „Max Müller · Müller Bau“ */
export function getKundeLabel(k: Pick<Kunde, "ansprechpartner" | "firma">): string {
  const name = getKundeName(k);
  const firma = k.firma?.trim();
  if (firma && firma !== name) return `${name} · ${firma}`;
  return name;
}

export function formatKundeAdresse(k: Pick<Kunde, "strasse" | "plz" | "ort">): string | null {
  const parts = [k.strasse?.trim(), [k.plz?.trim(), k.ort?.trim()].filter(Boolean).join(" ")].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
