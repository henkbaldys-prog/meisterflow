import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * Öffentliches Kontaktformular – speichert Anfrage, kein Spam-Versand.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subdomain = String(body.subdomain || "").toLowerCase().trim();
    const name = String(body.name || "").trim();
    const nachricht = String(body.nachricht || "").trim();
    const telefon = String(body.telefon || "").trim() || null;
    const email = String(body.email || "").trim() || null;

    if (!subdomain || !name || !nachricht) {
      return NextResponse.json(
        { error: "Name, Nachricht und Website erforderlich" },
        { status: 400 },
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!checkRateLimit(rateLimits, `website-kontakt:${ip}`, 20)) {
      return NextResponse.json({ error: "Zu viele Anfragen – bitte später erneut" }, { status: 429 });
    }

    const supabase = createAnonServerClient();
    const { data: site, error: siteErr } = await supabase
      .from("handwerker_websites")
      .select("id, user_id, status, email")
      .eq("subdomain", subdomain)
      .eq("status", "veroeffentlicht")
      .maybeSingle();

    if (siteErr || !site) {
      return NextResponse.json({ error: "Website nicht gefunden" }, { status: 404 });
    }

    const { error } = await supabase.from("website_anfragen").insert({
      website_id: site.id,
      user_id: site.user_id,
      name,
      telefon,
      email,
      nachricht,
      gelesen: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Optional: E-Mail an Betrieb via Resend (kein Bulk, 1 Mail)
    if (site.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM || "MeisterFlow <onboarding@resend.dev>",
          to: site.email,
          subject: `Neue Website-Anfrage von ${name}`,
          text: `Name: ${name}\nTelefon: ${telefon || "—"}\nE-Mail: ${email || "—"}\n\n${nachricht}\n\n— Gesendet über deine MeisterFlow-Website`,
        });
      } catch {
        // Anfrage ist gespeichert – Mail-Fehler nicht blockierend
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fehler" },
      { status: 500 },
    );
  }
}
