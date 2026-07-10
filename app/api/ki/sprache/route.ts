import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractSpracheAngebot, transcribeAudio } from "@/lib/openai";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const key = `${user.id}:ki-sprache`;
  if (!checkRateLimit(rateLimits, key, 30)) {
    return NextResponse.json({ error: "Rate limit überschritten" }, { status: 429 });
  }

  try {
    let buffer: Buffer;
    let filename = "aufnahme.webm";
    let mimeType = "audio/webm";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audio = formData.get("audio");

      if (!audio || !(audio instanceof Blob)) {
        return NextResponse.json({ error: "Keine Audiodatei erhalten" }, { status: 400 });
      }

      const arrayBuffer = await audio.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = audio.type || mimeType;
      if (audio instanceof File && audio.name) filename = audio.name;
    } else {
      const body = await req.json();
      const { audio } = body;

      if (!audio || typeof audio !== "string") {
        return NextResponse.json({ error: "Keine Audiodatei erhalten" }, { status: 400 });
      }

      const base64 = audio.includes(",") ? audio.split(",")[1] : audio;
      buffer = Buffer.from(base64, "base64");
      mimeType = body.mimeType || mimeType;
      filename = body.filename || filename;
    }

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Audiodatei ist leer" }, { status: 400 });
    }

    if (buffer.length > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audiodatei zu groß (max. 10 MB)" }, { status: 400 });
    }

    const transcript = await transcribeAudio(buffer, filename, mimeType);

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Sprache nicht erkannt – bitte deutlicher sprechen" },
        { status: 422 },
      );
    }

    const data = await extractSpracheAngebot(transcript);

    return NextResponse.json({
      success: true,
      transcript,
      data,
    });
  } catch (error: any) {
    const message = error?.message || "Verarbeitung fehlgeschlagen";
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "KI nicht konfiguriert" }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
