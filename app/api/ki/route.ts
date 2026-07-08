import { NextRequest, NextResponse } from "next/server";
import { generateAngebot, generateEmailAntwort, generateWhatsAppAntwort } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { type, beschreibung, kundenName, context, emailInhalt, nachricht } = await req.json();

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
