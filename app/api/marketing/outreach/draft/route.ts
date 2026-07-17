import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/angebot-tracking";
import {
  parseOutreachLeads,
  type OutreachDraft,
} from "@/lib/marketing-studio";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!checkRateLimit(rateLimits, `${user.id}:outreach-draft`, 15)) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const rawList = String(body.leads || "");
    const ton = String(body.ton || "freundlich").trim();
    const leads = parseOutreachLeads(rawList).slice(0, 20);

    if (leads.length === 0) {
      return NextResponse.json(
        { error: "Keine gültigen Zeilen. Format: Name;Firma;Stadt;Email" },
        { status: 400 },
      );
    }

    let drafts: OutreachDraft[];

    if (process.env.OPENAI_API_KEY) {
      drafts = (await generateDraftsWithOpenAI(leads, ton)) || fallbackDrafts(leads, ton);
    } else {
      drafts = fallbackDrafts(leads, ton);
    }

    return NextResponse.json({ drafts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

async function generateDraftsWithOpenAI(
  leads: { name: string; firma: string; stadt: string; email: string }[],
  ton: string,
): Promise<OutreachDraft[] | null> {
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
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Schreibe kurze B2B-Erstmails für MeisterFlow (Angebote tracken, nachfassen, mahnen – für Handwerker).
Ton: ${ton}
Kein Spam-Druck, kein „dringend“, max 90 Wörter Body.
Antwort NUR als JSON-Array:
[{"email":"...","subject":"...","body":"..."}]

Empfänger:
${JSON.stringify(leads)}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const arr = JSON.parse(fenced ? fenced[1] : raw) as {
      email: string;
      subject: string;
      body: string;
    }[];

    return leads.map((lead) => {
      const match =
        arr.find((a) => a.email?.toLowerCase() === lead.email.toLowerCase()) || arr[0];
      return {
        ...lead,
        subject: match?.subject || `Kurze Frage an ${lead.firma || "dich"}`,
        body: match?.body || fallbackBody(lead),
      };
    });
  } catch {
    return null;
  }
}

function fallbackBody(lead: {
  name: string;
  firma: string;
  stadt: string;
}): string {
  const who = lead.name || "Hallo";
  const firma = lead.firma ? ` (${lead.firma})` : "";
  const url = getAppBaseUrl();
  return `Hallo ${who}${firma},

kurze Frage: wie tracken Sie aktuell, ob Kunden Angebote überhaupt öffnen – und wer nachfasst?

MeisterFlow zeigt Öffnungen, erinnert nach 3 Tagen zum Nachfassen und hilft bei Mahnungen. Viele Solo-Handwerker sparen so Bürozeit.

Wenn interessant: 14 Tage kostenlos testen unter ${url}.

Viele Grüße
MeisterFlow`;
}

function fallbackDrafts(
  leads: { name: string; firma: string; stadt: string; email: string }[],
  _ton: string,
): OutreachDraft[] {
  return leads.map((lead) => ({
    ...lead,
    subject: lead.firma
      ? `Angebote bei ${lead.firma} – weniger Funkstille?`
      : "Weniger Funkstille nach Angeboten?",
    body: fallbackBody(lead),
  }));
}
