type PublicKunde = {
  firma?: string | null;
  ansprechpartner?: string | null;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
} | null;

type PublicFirma = {
  firmenname?: string | null;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  telefon?: string | null;
  email?: string | null;
  standard_angebotstext?: string | null;
} | null;

export type TrackedAngebot = {
  id: string;
  nummer: string;
  betreff: string;
  beschreibung: string;
  netto: number;
  mwst_satz: number;
  brutto: number;
  gueltig_bis: string;
  created_at: string;
  kunde: PublicKunde;
  firma: PublicFirma;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDeDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("de-DE");
  } catch {
    return value;
  }
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount) || 0);
}

function kundeName(kunde: PublicKunde): string {
  if (!kunde) return "Kunde";
  return (kunde.ansprechpartner || kunde.firma || "Kunde").trim();
}

function kundeAdresse(kunde: PublicKunde): string {
  if (!kunde) return "";
  const line = [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return line;
}

/** Mobile-freundliche HTML-Ansicht des Angebots (kein Download-Zwang). */
export function renderAngebotPublicHtml(angebot: TrackedAngebot): string {
  const firmaName = angebot.firma?.firmenname || "MeisterFlow";
  const firmaAdresse = angebot.firma
    ? [angebot.firma.strasse, [angebot.firma.plz, angebot.firma.ort].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : "";
  const intro =
    angebot.firma?.standard_angebotstext ||
    "Wir bedanken uns für Ihre Anfrage und unterbreiten Ihnen hiermit unser Angebot.";
  const mwst = Number(angebot.brutto) - Number(angebot.netto);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Angebot ${escapeHtml(angebot.nummer)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --brand: #2563eb;
      --line: #334155;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
      padding: 16px;
    }
    .wrap {
      max-width: 640px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,.35);
    }
    .header {
      background: var(--brand);
      padding: 20px 20px 18px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .header p {
      margin: 4px 0 0;
      opacity: .9;
      font-size: .875rem;
    }
    .content { padding: 20px; }
    .badge {
      display: inline-block;
      background: rgba(37,99,235,.15);
      color: #93c5fd;
      border: 1px solid rgba(37,99,235,.35);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: .75rem;
      font-weight: 600;
      letter-spacing: .02em;
      margin-bottom: 12px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.5rem;
    }
    .meta, .muted {
      color: var(--muted);
      font-size: .875rem;
    }
    .grid {
      display: grid;
      gap: 12px;
      margin: 18px 0;
    }
    @media (min-width: 520px) {
      .grid { grid-template-columns: 1fr 1fr; }
    }
    .box {
      background: rgba(15,23,42,.55);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
    }
    .box strong {
      display: block;
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .desc {
      white-space: pre-wrap;
      margin: 0;
      color: #e2e8f0;
      font-size: .95rem;
    }
    .sums {
      margin-top: 18px;
      border-top: 1px solid var(--line);
      padding-top: 14px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 6px 0;
      font-size: .95rem;
      color: var(--muted);
    }
    .row.total {
      color: var(--text);
      font-weight: 700;
      font-size: 1.125rem;
      margin-top: 10px;
    }
    .footer {
      padding: 0 20px 20px;
      color: var(--muted);
      font-size: .8rem;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>${escapeHtml(firmaName)}</h1>
      ${firmaAdresse ? `<p>${escapeHtml(firmaAdresse)}</p>` : ""}
      ${
        angebot.firma?.telefon || angebot.firma?.email
          ? `<p>${escapeHtml(
              [angebot.firma?.telefon, angebot.firma?.email].filter(Boolean).join(" · "),
            )}</p>`
          : ""
      }
    </div>
    <div class="content">
      <div class="badge">ANGEBOT ${escapeHtml(angebot.nummer)}</div>
      <h2>${escapeHtml(angebot.betreff)}</h2>
      <p class="meta">
        Datum: ${escapeHtml(formatDeDate(angebot.created_at))}
        · Gültig bis: ${escapeHtml(formatDeDate(angebot.gueltig_bis))}
      </p>
      <p class="muted" style="margin-top:14px">${escapeHtml(intro)}</p>

      <div class="grid">
        <div class="box">
          <strong>Kunde</strong>
          ${escapeHtml(kundeName(angebot.kunde))}
          ${
            angebot.kunde?.firma && angebot.kunde.firma !== angebot.kunde.ansprechpartner
              ? `<div class="muted">${escapeHtml(angebot.kunde.firma)}</div>`
              : ""
          }
          ${kundeAdresse(angebot.kunde) ? `<div class="muted">${escapeHtml(kundeAdresse(angebot.kunde))}</div>` : ""}
        </div>
        <div class="box">
          <strong>Leistung</strong>
          <p class="desc">${escapeHtml(angebot.beschreibung || angebot.betreff)}</p>
        </div>
      </div>

      <div class="sums">
        <div class="row"><span>Nettosumme</span><span>${escapeHtml(formatEuro(Number(angebot.netto)))}</span></div>
        <div class="row"><span>MwSt. (${escapeHtml(String(angebot.mwst_satz))}%)</span><span>${escapeHtml(formatEuro(mwst))}</span></div>
        <div class="row total"><span>Gesamtbetrag</span><span>${escapeHtml(formatEuro(Number(angebot.brutto)))}</span></div>
      </div>
    </div>
    <div class="footer">
      Bei Fragen melden Sie sich gerne bei ${escapeHtml(firmaName)}.
    </div>
  </div>
</body>
</html>`;
}
