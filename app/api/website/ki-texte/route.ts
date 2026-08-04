import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  if (!checkRateLimit(rateLimits, `${user.id}:website-ki`, 15)) {
    return NextResponse.json({ error: "Rate limit erreicht" }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { data: profil } = await supabase
      .from("firmenprofile")
      .select("firmenname, ort, gewerke")
      .eq("user_id", user.id)
      .maybeSingle();

    const firmenname = String(body.firmenname || profil?.firmenname || "Handwerksbetrieb");
    const ort = String(body.ort || profil?.ort || "Deutschland");
    const gewerk = String(
      body.gewerk || (Array.isArray(profil?.gewerke) && profil?.gewerke[0]) || "Handwerk",
    );

    const prompt = `Erstelle professionelle Webseiten-Texte für einen ${gewerk} namens ${firmenname} in ${ort}.
1. Hero-Headline (max. 8 Wörter)
2. Hero-Subheadline (1 Satz)
3. Über-uns Text (3 Sätze)
4. Leistungen als Bullet Points (5 Stück)
5. SEO-Beschreibung (160 Zeichen)
Antworte NUR als JSON:
{"hero_headline":"...","hero_subheadline":"...","ueber_uns":"...","leistungen":["..."],"seo_beschreibung":"..."}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err.slice(0, 200));
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const parsed = JSON.parse(fenced ? fenced[1] : raw);

    return NextResponse.json({
      texte: {
        hero_headline: String(parsed.hero_headline || ""),
        hero_subheadline: String(parsed.hero_subheadline || ""),
        ueber_uns: String(parsed.ueber_uns || ""),
        leistungen: Array.isArray(parsed.leistungen) ? parsed.leistungen.map(String) : [],
        seo_beschreibung: String(parsed.seo_beschreibung || ""),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "KI-Fehler" },
      { status: 500 },
    );
  }
}
