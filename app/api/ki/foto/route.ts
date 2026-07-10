import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzeBaustellenFoto } from "@/lib/openai";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const key = `${user.id}:ki-foto`;
  if (!checkRateLimit(rateLimits, key, 20)) {
    return NextResponse.json({ error: "Rate limit überschritten" }, { status: 429 });
  }

  try {
    const { image, mimeType: providedMime } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Kein Bild erhalten" }, { status: 400 });
    }

    const base64 = image.includes(",") ? image.split(",")[1] : image;
    const buffer = Buffer.from(base64, "base64");

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Bild ist leer" }, { status: 400 });
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Bild zu groß (max. 5 MB)" }, { status: 400 });
    }

    const mimeType = providedMime || "image/jpeg";
    const data = await analyzeBaustellenFoto(base64, mimeType);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    const message = error?.message || "Bildanalyse fehlgeschlagen";
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "KI nicht konfiguriert" }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
