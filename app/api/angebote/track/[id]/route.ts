import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase-admin";
import { renderAngebotPublicHtml, type TrackedAngebot } from "@/lib/angebot-public-html";

/**
 * Öffentlicher Tracking-Link für Angebote.
 * Speichert gelesen_am (erster Aufruf) und zeigt das Angebot mobil-freundlich als HTML
 * (kein Download-Zwang auf dem Handy).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return new NextResponse("Ungültiger Link", { status: 400 });
  }

  try {
    const supabase = createAnonServerClient();
    const { data, error } = await supabase.rpc("track_and_get_angebot", {
      p_id: id,
    });

    if (error) {
      console.error("track_and_get_angebot:", error);
      return new NextResponse(
        "Angebot konnte nicht geladen werden. Bitte den Handwerker kontaktieren.",
        { status: 500 },
      );
    }

    if (!data) {
      return new NextResponse("Angebot nicht gefunden", { status: 404 });
    }

    const angebot = data as TrackedAngebot;
    const html = renderAngebotPublicHtml(angebot);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (err) {
    console.error("Angebot track error:", err);
    return new NextResponse("Interner Fehler", { status: 500 });
  }
}
