import type { Angebot, FollowUp } from "@/types";

export type MonthBucket = {
  key: string; // YYYY-MM
  label: string;
  gewonnen: number;
  verloren: number;
};

export type VerlustAnalyse = {
  verlorenMonat: number;
  anzahlOhneFollowUp: number;
  anzahlAbgelehntMonat: number;
  anzahlVersendetAlt: number;
  grund: string;
  kiTipp: string;
  chart: MonthBucket[];
};

export type UmsatzPrognose = {
  potenzial: number;
  wahrscheinlichkeit: number;
  realistisch: number;
  mitFollowUp: number;
  plusDurchFollowUp: number;
  offeneAnzahl: number;
};

export type Preisvorschlag = {
  aehnlichCount: number;
  durchschnitt: number;
  empfehlungMin: number;
  empfehlungMax: number;
  empfehlung: number;
  hinweis: string;
} | null;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function similarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter++;
  });
  return inter / Math.max(ta.size, tb.size);
}

/** Angebote ohne Follow-up / abgelehnt = „verloren“ für Analyse */
export function computeVerlustAnalyse(
  angebote: Angebot[],
  followUps: FollowUp[],
): VerlustAnalyse {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const offenFollowUpAngebotIds = new Set(
    followUps.filter((f) => f.status === "offen").map((f) => f.angebot_id),
  );

  const abgelehntMonat = angebote.filter(
    (a) => a.status === "abgelehnt" && new Date(a.created_at) >= monthStart,
  );

  const versendetAltOhneFollowUp = angebote.filter((a) => {
    if (a.status !== "versendet") return false;
    const days = (now.getTime() - new Date(a.created_at).getTime()) / 86400000;
    if (days < 3) return false;
    // kein offenes Follow-up und nicht gelesen → Risiko
    const hasOpenFu = offenFollowUpAngebotIds.has(a.id);
    return !hasOpenFu || !a.gelesen_am;
  });

  // „Verloren“-Summe: abgelehnt diesen Monat + alte versendete ohne Follow-up (Risiko)
  const verlorenAbgelehnt = abgelehntMonat.reduce((s, a) => s + Number(a.brutto || 0), 0);
  const risikoVersendet = versendetAltOhneFollowUp.reduce(
    (s, a) => s + Number(a.brutto || 0),
    0,
  );
  const verlorenMonat = verlorenAbgelehnt + risikoVersendet;

  const anzahlOhneFollowUp = versendetAltOhneFollowUp.length;
  const anzahlAbgelehntMonat = abgelehntMonat.length;

  let grund = "Keine auffälligen Verluste diesen Monat.";
  if (anzahlOhneFollowUp > 0) {
    grund = `Grund: Kein Follow-up bei ${anzahlOhneFollowUp} Angebot${anzahlOhneFollowUp === 1 ? "" : "en"}`;
  } else if (anzahlAbgelehntMonat > 0) {
    grund = `Grund: ${anzahlAbgelehntMonat} Angebot${anzahlAbgelehntMonat === 1 ? "" : "e"} abgelehnt`;
  }

  // Chart last 6 months
  const chart: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const inMonth = angebote.filter((a) => {
      const c = new Date(a.created_at);
      return c >= d && c < next;
    });
    chart.push({
      key,
      label: monthLabel(key),
      gewonnen: inMonth
        .filter((a) => a.status === "angenommen")
        .reduce((s, a) => s + Number(a.brutto || 0), 0),
      verloren: inMonth
        .filter((a) => a.status === "abgelehnt")
        .reduce((s, a) => s + Number(a.brutto || 0), 0),
    });
  }

  // KI-Tipp (regelbasiert, kein API-Call nötig)
  let kiTipp = "Weiter so – behalte offene Angebote im Blick.";
  const topRisk = [...versendetAltOhneFollowUp].sort(
    (a, b) => Number(b.brutto) - Number(a.brutto),
  )[0];
  if (topRisk) {
    const kunde = topRisk.kunde
      ? topRisk.kunde.firma || topRisk.kunde.ansprechpartner || "diesem Kunden"
      : "diesem Kunden";
    kiTipp = `Wenn Sie bei ${kunde} nachfassen, erhöht sich Ihre Chance um ca. 40%.`;
  } else if (abgelehntMonat.length > 0) {
    kiTipp =
      "Prüfen Sie abgelehnte Angebote: Oft hilft ein angepasster Preis oder ein kürzeres Follow-up.";
  }

  return {
    verlorenMonat,
    anzahlOhneFollowUp,
    anzahlAbgelehntMonat,
    anzahlVersendetAlt: versendetAltOhneFollowUp.length,
    grund,
    kiTipp,
    chart,
  };
}

export function computeUmsatzPrognose(angebote: Angebot[]): UmsatzPrognose {
  const offen = angebote.filter((a) => a.status === "entwurf" || a.status === "versendet");
  const potenzial = offen.reduce((s, a) => s + Number(a.brutto || 0), 0);

  // Heuristik: Entwurf 40%, versendet ungelesen 50%, versendet gelesen 70%
  let gewichtet = 0;
  for (const a of offen) {
    let p = 0.4;
    if (a.status === "versendet") p = a.gelesen_am ? 0.7 : 0.5;
    gewichtet += Number(a.brutto || 0) * p;
  }

  const wahrscheinlichkeit =
    potenzial > 0 ? Math.round((gewichtet / potenzial) * 100) : 0;
  const realistisch = Math.round(gewichtet);
  const mitFollowUp = Math.round(potenzial * Math.min(0.85, (wahrscheinlichkeit + 20) / 100));
  const plusDurchFollowUp = Math.max(0, mitFollowUp - realistisch);

  return {
    potenzial: Math.round(potenzial),
    wahrscheinlichkeit,
    realistisch,
    mitFollowUp,
    plusDurchFollowUp,
    offeneAnzahl: offen.length,
  };
}

export function computePreisvorschlag(
  angebote: Angebot[],
  betreff: string,
  beschreibung: string,
  aktuellerNetto: number,
): Preisvorschlag {
  const query = `${betreff} ${beschreibung}`.trim();
  if (query.length < 4) return null;

  const accepted = angebote.filter(
    (a) =>
      (a.status === "angenommen" || a.status === "versendet") && Number(a.netto) > 0,
  );

  const scored = accepted
    .map((a) => ({
      a,
      score: Math.max(
        similarity(query, a.betreff || ""),
        similarity(query, `${a.betreff} ${a.beschreibung}`),
      ),
    }))
    .filter((x) => x.score >= 0.15)
    .sort((x, y) => y.score - x.score)
    .slice(0, 8);

  if (scored.length < 2) return null;

  const values = scored.map((x) => Number(x.a.netto));
  const durchschnitt = values.reduce((s, v) => s + v, 0) / values.length;
  const empfehlungMin = Math.round(durchschnitt * 0.95);
  const empfehlungMax = Math.round(durchschnitt * 1.08);
  const empfehlung = Math.round((empfehlungMin + empfehlungMax) / 2);

  let hinweis = `Ähnliche Aufträge: Ø ${Math.round(durchschnitt).toLocaleString("de-DE")}€.`;
  if (aktuellerNetto > 0) {
    hinweis += ` Ihr Entwurf: ${Math.round(aktuellerNetto).toLocaleString("de-DE")}€.`;
    if (aktuellerNetto < empfehlungMin) {
      hinweis += " Sie liegen unter dem Markt.";
    } else if (aktuellerNetto > empfehlungMax) {
      hinweis += " Sie liegen über vergleichbaren Aufträgen.";
    } else {
      hinweis += " Passt gut zu vergleichbaren Aufträgen.";
    }
  }

  return {
    aehnlichCount: scored.length,
    durchschnitt: Math.round(durchschnitt),
    empfehlungMin,
    empfehlungMax,
    empfehlung,
    hinweis,
  };
}
