import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { angebotPdfBytes, AngebotPdfData } from "@/lib/angebot-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TrackPayload = AngebotPdfData & {
  id: string;
  gelesen_am?: string | null;
  status?: string;
};

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase nicht konfiguriert");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDateDe(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function kundeDisplayName(kunde: TrackPayload["kunde"]): string {
  if (!kunde) return "Kunde";
  return kunde.firma || kunde.ansprechpartner || "Kunde";
}

function buildMobileHtml(data: TrackPayload, pdfUrl: string): string {
  const brand = data.firma?.firmenname || "MeisterFlow";
  const firmaExtra = data.firma as { standard_angebotstext?: string } | null | undefined;
  const intro = firmaExtra?.standard_angebotstext || null;
  const kundeName = kundeDisplayName(data.kunde);
  const adresseParts = [
    data.kunde?.strasse,
    [data.kunde?.plz, data.kunde?.ort].filter(Boolean).join(" "),
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Angebot ${escapeHtml(data.nummer)} – ${escapeHtml(brand)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #e8eef7;
      color: #0f172a;
      line-height: 1.5;
      -webkit-text-size-adjust: 100%;
    }
    .wrap { max-width: 640px; margin: 0 auto; padding: 16px; padding-bottom: 96px; }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .header {
      background: #2563eb;
      color: #fff;
      padding: 20px 20px 18px;
    }
    .header h1 { margin: 0; font-size: 1.35rem; }
    .header p { margin: 6px 0 0; opacity: 0.9; font-size: 0.9rem; }
    .body { padding: 20px; }
    .meta { display: grid; gap: 8px; margin-bottom: 18px; font-size: 0.92rem; color: #475569; }
    .meta strong { color: #0f172a; }
    .box {
      background: #f8fafc;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .box h2 { margin: 0 0 8px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    .betreff { font-size: 1.1rem; font-weight: 700; margin: 0 0 8px; }
    .desc { white-space: pre-wrap; color: #334155; font-size: 0.95rem; }
    .sum {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      margin-top: 16px;
    }
    .sum .label { color: #64748b; font-size: 0.9rem; }
    .sum .value { font-size: 1.35rem; font-weight: 800; color: #2563eb; }
    .rows { font-size: 0.9rem; color: #475569; }
    .rows div { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .cta {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: rgba(232, 238, 247, 0.92);
      backdrop-filter: blur(8px);
      border-top: 1px solid #dbe3f0;
    }
    .cta a {
      display: block;
      text-align: center;
      text-decoration: none;
      background: #2563eb;
      color: #fff;
      font-weight: 700;
      border-radius: 12px;
      padding: 14px 16px;
      min-height: 48px;
    }
    .hint { text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 8px; }
    @media print {
      body { background: #fff; }
      .cta { display: none; }
      .wrap { padding: 0; }
      .card { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <h1>${escapeHtml(brand)}</h1>
        <p>Angebot ${escapeHtml(data.nummer)}</p>
      </div>
      <div class="body">
        <div class="meta">
          <div>Datum: <strong>${escapeHtml(formatDateDe(data.created_at))}</strong></div>
          ${
            data.gueltig_bis
              ? `<div>Gültig bis: <strong>${escapeHtml(formatDateDe(data.gueltig_bis))}</strong></div>`
              : ""
          }
        </div>

        <div class="box">
          <h2>Kunde</h2>
          <div><strong>${escapeHtml(kundeName)}</strong></div>
          ${adresseParts.map((p) => `<div>${escapeHtml(String(p))}</div>`).join("")}
        </div>

        ${intro ? `<p class="desc" style="margin-bottom:16px">${escapeHtml(intro)}</p>` : ""}

        <p class="betreff">${escapeHtml(data.betreff)}</p>
        <p class="desc">${escapeHtml(data.beschreibung || "")}</p>

        <div class="rows" style="margin-top:18px">
          <div><span>Nettosumme</span><span>${escapeHtml(formatEuro(Number(data.netto)))}</span></div>
          <div><span>MwSt. (${escapeHtml(String(data.mwst_satz))}%)</span><span>${escapeHtml(
            formatEuro(Number(data.brutto) - Number(data.netto)),
          )}</span></div>
        </div>
        <div class="sum">
          <span class="label">Gesamtbetrag inkl. MwSt.</span>
          <span class="value">${escapeHtml(formatEuro(Number(data.brutto)))}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="cta">
    <a href="${escapeHtml(pdfUrl)}" rel="noopener">PDF öffnen</a>
    <p class="hint">Öffnet das Angebot als PDF – auch auf dem Handy.</p>
  </div>
</body>
</html>`;
}

async function loadTrackedAngebot(id: string): Promise<TrackPayload | null> {
  const supabase = getAnonClient();
  const { data, error } = await supabase.rpc("open_angebot_tracking", { p_id: id });

  if (error) {
    console.error("open_angebot_tracking:", error.message);
    throw error;
  }

  if (!data) return null;
  return data as TrackPayload;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Ungültige Angebots-ID", { status: 400 });
  }

  try {
    const angebot = await loadTrackedAngebot(id);
    if (!angebot) {
      return new NextResponse("Angebot nicht gefunden", { status: 404 });
    }

    const wantPdf = request.nextUrl.searchParams.get("format") === "pdf";

    if (wantPdf) {
      const bytes = angebotPdfBytes(angebot);
      return new NextResponse(Buffer.from(bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          // inline = Handy zeigt PDF an, statt Download zu blockieren
          "Content-Disposition": `inline; filename="Angebot_${angebot.nummer}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    // Mobile-First: HTML-Ansicht (kein Download-Block), PDF per Button
    const pdfUrl = `${request.nextUrl.pathname}?format=pdf`;
    const html = buildMobileHtml(angebot, pdfUrl);
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: any) {
    console.error("Track error:", error);
    return new NextResponse(
      "Angebot konnte nicht geladen werden. Bitte SQL-Migration (angebot-tracking.sql) prüfen.",
      { status: 500 },
    );
  }
}
