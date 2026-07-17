import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeVideoPackage, type VideoPackage } from "@/lib/marketing-studio";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!checkRateLimit(rateLimits, `${user.id}:video`, 10)) {
    return NextResponse.json({ error: "Rate limit – später erneut versuchen" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const gewerk = String(body.gewerk || "Handwerker").trim();
    const thema = String(body.thema || "Büroarbeit sparen").trim();
    const laenge_sek = Number(body.laenge_sek) || 30;
    const plattform = String(body.plattform || "Reels").trim();

    let pkg: VideoPackage;

    if (process.env.OPENAI_API_KEY) {
      const generated = await generateWithOpenAI({ gewerk, thema, laenge_sek, plattform });
      pkg = generated || fallbackPackage({ gewerk, thema, laenge_sek, plattform });
    } else {
      pkg = fallbackPackage({ gewerk, thema, laenge_sek, plattform });
    }

    await writeVideoPackage(pkg);
    return NextResponse.json({ package: pkg });
  } catch (e: any) {
    console.error("video generate:", e);
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { listVideoPackages } = await import("@/lib/marketing-studio");
  const packages = await listVideoPackages();
  return NextResponse.json({ packages });
}

async function generateWithOpenAI(input: {
  gewerk: string;
  thema: string;
  laenge_sek: number;
  plattform: string;
}): Promise<VideoPackage | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.75,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: `Du bist Social-Media-Stratege für deutsche Handwerker-Software (MeisterFlow).
Erstelle ein fertiges Kurzvideo-Paket zum Hochladen auf ${input.plattform}.

Gewerk-Zielgruppe: ${input.gewerk}
Thema/Hook-Idee: ${input.thema}
Länge: ca. ${input.laenge_sek} Sekunden

Antwort NUR als JSON:
{
  "hook": "erster Satz / Hook (max 12 Wörter)",
  "szenen": [{"zeit":"0-3s","bild":"was filmen","text_on_screen":"kurzer Text"}],
  "sprechertext": "kompletter Voiceover-Text",
  "captions": ["Zeile1","Zeile2"],
  "caption_post": "Post-Caption mit CTA, ohne Hashtags",
  "hashtags": ["#Handwerk","#Büro"],
  "checklist": ["Cover wählen","...", "..."],
  "capcut_tipp": "1-2 Sätze wie man das in CapCut zusammenbaut"
}

Regeln: Deutsch, direkt, kein Blabla, max 5 Szenen, CTA auf MeisterFlow nur am Ende dezent.`,
          },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const json = JSON.parse(fenced ? fenced[1] : raw);

    return {
      id: `vid-${Date.now()}`,
      created_at: new Date().toISOString(),
      gewerk: input.gewerk,
      thema: input.thema,
      laenge_sek: input.laenge_sek,
      plattform: input.plattform,
      hook: String(json.hook || ""),
      szenen: Array.isArray(json.szenen) ? json.szenen : [],
      sprechertext: String(json.sprechertext || ""),
      captions: Array.isArray(json.captions) ? json.captions.map(String) : [],
      caption_post: String(json.caption_post || ""),
      hashtags: Array.isArray(json.hashtags) ? json.hashtags.map(String) : [],
      checklist: Array.isArray(json.checklist) ? json.checklist.map(String) : [],
      capcut_tipp: String(json.capcut_tipp || ""),
    };
  } catch {
    return null;
  }
}

function fallbackPackage(input: {
  gewerk: string;
  thema: string;
  laenge_sek: number;
  plattform: string;
}): VideoPackage {
  return {
    id: `vid-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...input,
    hook: "Angebote versanden? Das hier ändert alles.",
    szenen: [
      {
        zeit: "0-3s",
        bild: "Handy mit Angebot auf Baustelle",
        text_on_screen: "Angebot gesendet…",
      },
      {
        zeit: "3-10s",
        bild: "Dashboard: noch nicht geöffnet",
        text_on_screen: "Kunde hat nicht geöffnet",
      },
      {
        zeit: "10-20s",
        bild: "WhatsApp Nachfassen-Button tippen",
        text_on_screen: "Nachfassen in 1 Klick",
      },
      {
        zeit: "20-30s",
        bild: "Logo / App-Screen",
        text_on_screen: "MeisterFlow – weniger Büro",
      },
    ],
    sprechertext: `Hey ${input.gewerk} – kennst du das? Angebot raus, dann Funkstille. Mit MeisterFlow siehst du, ob der Kunde geöffnet hat, und fasst in einem Klick nach. Weniger Liegenbleiber, mehr Aufträge. Link in Bio.`,
    captions: [
      "Angebot raus… Funkstille?",
      "Siehst du, ob geöffnet wurde",
      "Nachfassen in 1 Klick",
      "MeisterFlow – Link in Bio",
    ],
    caption_post: `${input.thema} – so verlierst du weniger Aufträge.\n\nTracking + Nachfassen + Mahnungen in einer App für Handwerker.\n\n👉 Link in Bio – 14 Tage testen`,
    hashtags: ["#Handwerk", "#Elektriker", "#Sanitaer", "#Büroarbeit", "#MeisterFlow", "#Selbststaendig"],
    checklist: [
      "Vertikal 9:16 filmen oder CapCut-Slides",
      "Hook in den ersten 2 Sekunden groß einblenden",
      "Captions als Auto-Captions oder manuell",
      "Cover-Frame mit starkem Text wählen",
      "Link in Bio / Story-Sticker setzen",
      "Unter Video CTA: kostenlos testen",
    ],
    capcut_tipp:
      "In CapCut: Text-Templates → 4 Folien mit den Captions, Voiceover aufnehmen oder Text-to-Speech DE, Trend-Sound leise darunter, Export 1080x1920.",
  };
}
