import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { appendOutreachLog } from "@/lib/marketing-studio";

const rateLimits: Record<string, { count: number; resetAt: number }> = {};

/**
 * Sendet EINE Outreach-Mail nach expliziter Freigabe.
 */
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!checkRateLimit(rateLimits, `${user.id}:outreach-send`, 20)) {
    return NextResponse.json(
      { error: "Rate limit – max. 20 Outreach-Mails / Stunde" },
      { status: 429 },
    );
  }

  try {
    const { to, subject, body, confirmed } = await req.json();

    if (!confirmed) {
      return NextResponse.json(
        { error: "Bitte Versand bestätigen (confirmed: true)" },
        { status: 400 },
      );
    }

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject, body erforderlich" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY fehlt – Mail nicht gesendet", dryRun: true },
        { status: 500 },
      );
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
  <div style="max-width:560px;margin:0 auto;padding:20px">
    ${String(body).replace(/\n/g, "<br>")}
  </div>
</body></html>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "MeisterFlow <onboarding@resend.dev>",
      to: [String(to)],
      subject: String(subject),
      html,
      text: String(body),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await appendOutreachLog({
      at: new Date().toISOString(),
      email: String(to),
      subject: String(subject),
      user_id: user.id,
    });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Versand fehlgeschlagen" }, { status: 500 });
  }
}
