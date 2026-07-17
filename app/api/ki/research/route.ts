import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  normalizePublicEmail,
  normalizeUrl,
  type ResearchLeadInput,
} from "@/types/research";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * KI-Lead-Recherche – nur öffentliche Daten, KEIN Auto-Versand.
 */
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!checkRateLimit(rateLimits, `${user.id}:ki-research`, 10)) {
    return NextResponse.json(
      { error: "Rate limit: max. 10 Recherchen pro Stunde" },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const gewerk = String(body.gewerk || "").trim();
    const stadt = String(body.stadt || "").trim();
    const anzahl = Math.min(20, Math.max(1, Number(body.anzahl) || 10));

    if (!gewerk || !stadt) {
      return NextResponse.json({ error: "gewerk und stadt erforderlich" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
    }

    // Optional: Google CSE als Kontext (kein Scraping)
    let cseHints: string[] = [];
    if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID) {
      cseHints = await googleCseHints(gewerk, stadt, anzahl);
    }

    const rawLeads = await researchWithOpenAI({ gewerk, stadt, anzahl, cseHints });
    const withTexts = await enrichWithTexts(rawLeads, gewerk, stadt);

    const toInsert = withTexts.map((l) => ({
      user_id: user.id,
      firma: l.firma,
      gewerk,
      stadt,
      webseite: l.webseite,
      email: l.email,
      telefon: l.telefon,
      status: "nicht_kontaktiert" as const,
      text_kurz: l.text_kurz,
      text_mittel: l.text_mittel,
      text_lang: l.text_lang,
      quelle: "KI-Recherche (öffentliche Daten)",
      updated_at: new Date().toISOString(),
    }));

    const { data: saved, error } = await supabase
      .from("research_leads")
      .insert(toInsert)
      .select();

    if (error) {
      // Tabelle fehlt ggf. – trotzdem Ergebnisse zurückgeben
      console.warn("research_leads insert:", error.message);
      return NextResponse.json({
        leads: toInsert.map((l, i) => ({
          ...l,
          id: `tmp-${Date.now()}-${i}`,
          created_at: new Date().toISOString(),
        })),
        quelle: "KI-Recherche (öffentliche Daten)",
        hinweis:
          "Bitte prüfen, ob Daten aktuell sind. Speichern fehlgeschlagen – führe supabase/research-leads.sql aus.",
        saveError: error.message,
      });
    }

    return NextResponse.json({
      leads: saved,
      quelle: "KI-Recherche (öffentliche Daten)",
      hinweis: "Bitte prüfen, ob Daten aktuell sind. Kein Auto-Versand – nur manuell kontaktieren.",
    });
  } catch (e: any) {
    console.error("research:", e);
    return NextResponse.json({ error: e.message || "Recherche fehlgeschlagen" }, { status: 500 });
  }
}

async function googleCseHints(gewerk: string, stadt: string, anzahl: number): Promise<string[]> {
  try {
    const q = encodeURIComponent(`${gewerk} ${stadt} Handwerk Impressum`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${q}&num=${Math.min(anzahl, 10)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(
      (item: { title?: string; link?: string; snippet?: string }) =>
        `${item.title || ""} | ${item.link || ""} | ${item.snippet || ""}`,
    );
  } catch {
    return [];
  }
}

async function researchWithOpenAI(opts: {
  gewerk: string;
  stadt: string;
  anzahl: number;
  cseHints: string[];
}): Promise<ResearchLeadInput[]> {
  const hintBlock =
    opts.cseHints.length > 0
      ? `\nZusätzliche öffentliche Suchtreffer (nur als Hinweis, prüfen):\n${opts.cseHints.join("\n")}\n`
      : "";

  const prompt = `Liste öffentlich zugängliche Handwerker-Betriebe in ${opts.stadt} für ${opts.gewerk}.
Maximal ${opts.anzahl}. Pro Betrieb: Firmenname, Webseite/Instagram (falls öffentlich), öffentliche E-Mail (falls im Impressum), öffentliche Telefon (falls auf Webseite).
Wenn keine E-Mail öffentlich: "nicht öffentlich".
WICHTIG: NUR öffentlich zugängliche Daten. Keine privaten Daten.
Keine erfundenen E-Mails.
${hintBlock}
JSON-Format:
[{"name":"...","gewerk":"${opts.gewerk}","stadt":"${opts.stadt}","website":"...","email":"...","phone":"...","quelle":"öffentlich"}]`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: Math.min(4000, 800 + opts.anzahl * 120),
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Fehler: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const arr = JSON.parse(fenced ? fenced[1] : raw) as {
    name?: string;
    firma?: string;
    website?: string;
    webseite?: string;
    email?: string;
    phone?: string;
    telefon?: string;
    quelle?: string;
  }[];

  return (Array.isArray(arr) ? arr : [])
    .slice(0, opts.anzahl)
    .map((item) => {
      const phoneRaw = item.phone ?? item.telefon;
      return {
        firma: String(item.name || item.firma || "Unbekannt").trim(),
        gewerk: opts.gewerk,
        stadt: opts.stadt,
        webseite: normalizeUrl(item.website ?? item.webseite),
        email: normalizePublicEmail(item.email),
        telefon:
          phoneRaw && !/keine|unbekannt|nicht öffentlich/i.test(String(phoneRaw))
            ? String(phoneRaw).trim()
            : null,
        quelle: item.quelle || "KI-Recherche (öffentliche Daten)",
      };
    })
    .filter((l) => l.firma && l.firma !== "Unbekannt");
}

async function enrichWithTexts(
  leads: ResearchLeadInput[],
  gewerk: string,
  stadt: string,
): Promise<
  (ResearchLeadInput & {
    text_kurz: string;
    text_mittel: string;
    text_lang: string;
  })[]
> {
  if (leads.length === 0) return [];

  const prompt = `Du schreibst Ansprache-VORSCHLÄGE für MeisterFlow (App für Handwerker: Angebote per Sprache, Tracking, Follow-ups, Mahnungen).
Absender: Henk, Gründer von MeisterFlow.
Gewerk-Kontext: ${gewerk} in ${stadt}.

Für JEDE Firma 3 Varianten auf Deutsch:
1. text_kurz – WhatsApp, max 2 Sätze
2. text_mittel – kurze E-Mail, Bezug auf Gewerk
3. text_lang – E-Mail mit Problem-Lösung (max 120 Wörter)

WICHTIG: Nur Vorschläge zum manuellen Kopieren. Kein Spam-Druck.

Leads:
${JSON.stringify(
  leads.map((l) => ({
    firma: l.firma,
    webseite: l.webseite,
    email: l.email,
  })),
)}

Antwort NUR als JSON-Array parallel zu den Leads:
[{"firma":"...","text_kurz":"...","text_mittel":"...","text_lang":"..."}]`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error("text gen failed");
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const texts = JSON.parse(fenced ? fenced[1] : raw) as {
      firma?: string;
      text_kurz?: string;
      text_mittel?: string;
      text_lang?: string;
    }[];

    return leads.map((lead, i) => {
      const match =
        texts.find((t) => t.firma?.toLowerCase() === lead.firma.toLowerCase()) || texts[i];
      return {
        ...lead,
        text_kurz: match?.text_kurz || defaultKurz(lead.firma, gewerk),
        text_mittel: match?.text_mittel || defaultMittel(lead.firma, gewerk),
        text_lang: match?.text_lang || defaultLang(lead.firma, gewerk),
      };
    });
  } catch {
    return leads.map((lead) => ({
      ...lead,
      text_kurz: defaultKurz(lead.firma, gewerk),
      text_mittel: defaultMittel(lead.firma, gewerk),
      text_lang: defaultLang(lead.firma, gewerk),
    }));
  }
}

function defaultKurz(firma: string, gewerk: string) {
  return `Hallo ${firma}, ich bin Henk und baue MeisterFlow für ${gewerk} wie dich. Per Sprache Angebote erstellen – interessiert?`;
}

function defaultMittel(firma: string, gewerk: string) {
  return `Hallo ${firma},

ich baue MeisterFlow – speziell für ${gewerk}: Angebote per Sprache/Foto, Tracking ob Kunden öffnen, und Nachfassen ohne Excel-Chaos.

Falls das spannend klingt, antworte gerne kurz – oder testen Sie 14 Tage kostenlos.

Viele Grüße
Henk`;
}

function defaultLang(firma: string, gewerk: string) {
  return `Hallo ${firma},

Problem: Angebote gehen raus – und dann oft Funkstille. Nachfassen und Mahnungen bleiben im Alltag liegen.

Lösung: MeisterFlow für ${gewerk} – Angebot erstellen (Sprache/Foto), sehen ob geöffnet, nach 3 Tagen nachfassen, offene Rechnungen mahnen.

Kein Spam von meiner Seite – nur eine Einladung zum Testen, wenn es passt.

Viele Grüße
Henk
MeisterFlow`;
}
