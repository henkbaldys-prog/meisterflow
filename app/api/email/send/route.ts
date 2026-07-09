import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const key = `${user.id}:email`;
  if (!checkRateLimit(rateLimits, key, 50)) {
    return NextResponse.json({ error: "Rate limit überschritten" }, { status: 429 });
  }

  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Empfänger und Betreff erforderlich" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "E-Mail-Versand nicht konfiguriert (RESEND_API_KEY fehlt)" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: "Mindflow <onboarding@resend.dev>",
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json({ error: "E-Mail-Versand fehlgeschlagen" }, { status: 500 });
  }
}
