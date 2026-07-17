import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateAngebot, generateEmailAntwort, generateWhatsAppAntwort, generateTagesuebersicht } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const key = `${user.id}:ki`;
  if (!checkRateLimit(rateLimits, key, 20)) {
    return NextResponse.json({ error: "Rate limit überschritten" }, { status: 429 });
  }

  try {
    const { type, beschreibung, kundenName, context, emailInhalt, nachricht, zahlen, aeltesteOffeneAngebote, ueberfaelligeRechnungen, ungeöffneteAngebote } =
      await req.json();

    if (type === "tagesuebersicht") {
      const text = await generateTagesuebersicht(
        zahlen || {},
        aeltesteOffeneAngebote || [],
        ueberfaelligeRechnungen || [],
        ungeöffneteAngebote || [],
      );
      return NextResponse.json({ text });
    }

    if (type === "angebot") {
      const text = await generateAngebot(beschreibung, kundenName);
      return NextResponse.json({ text });
    }

    if (type === "email") {
      const text = await generateEmailAntwort(emailInhalt, kundenName, context);
      return NextResponse.json({ text });
    }

    if (type === "whatsapp") {
      const text = await generateWhatsAppAntwort(nachricht, kundenName);
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "Unbekannter Typ" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
