import { AngebotInitialData, FotoAngebotData, SpracheAngebotData } from "@/types";

export function spracheToInitialData(data: SpracheAngebotData): AngebotInitialData {
  const beschreibungParts = [
    data.leistung && `Leistung: ${data.leistung}`,
    data.material && `Material: ${data.material}`,
    data.menge && `Menge: ${data.menge}`,
    data.besonderheiten && `Besonderheiten: ${data.besonderheiten}`,
    data.geschätzte_dauer_stunden != null &&
      `Geschätzte Dauer: ${data.geschätzte_dauer_stunden} Stunden`,
  ].filter(Boolean);

  return {
    kunde_name: data.kunde_name,
    leistung: data.leistung,
    material: data.material,
    menge: data.menge,
    besonderheiten: data.besonderheiten,
    geschätzte_dauer_stunden: data.geschätzte_dauer_stunden,
    betreff: data.leistung ? `Angebot: ${data.leistung}` : data.zusammenfassung,
    beschreibung: beschreibungParts.join("\n"),
  };
}

export function fotoToInitialData(data: FotoAngebotData, angebotsvorschlag?: string): AngebotInitialData {
  const text = angebotsvorschlag ?? data.angebotsvorschlag;
  const arbeitenList = data.arbeiten?.length ? `\n\nArbeiten:\n- ${data.arbeiten.join("\n- ")}` : "";
  const materialList = data.materialien?.length
    ? `\n\nMaterialien:\n- ${data.materialien.join("\n- ")}`
    : "";

  return {
    betreff: data.arbeiten?.[0] ? `Angebot: ${data.arbeiten[0]}` : `Angebot: ${data.beschreibung.slice(0, 60)}`,
    beschreibung: `${text}${arbeitenList}${materialList}\n\nGeschätzter Aufwand: ${data.geschätzter_aufwand}\n\n${data.hinweis}`,
    leistung: data.arbeiten?.join(", "),
    material: data.materialien?.join(", "),
  };
}

export function findKundeIdByName(
  kunden: { id: string; firma: string; ansprechpartner: string }[],
  name?: string | null,
): string {
  if (!name) return "";
  const lower = name.toLowerCase();
  const match = kunden.find(
    (k) =>
      k.firma.toLowerCase().includes(lower) ||
      k.ansprechpartner.toLowerCase().includes(lower) ||
      lower.includes(k.firma.toLowerCase()) ||
      lower.includes(k.ansprechpartner.toLowerCase()),
  );
  return match?.id || "";
}

export function defaultGueltigBis(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
}
