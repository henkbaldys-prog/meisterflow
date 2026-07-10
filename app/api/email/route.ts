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

  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const key = `${user.id}:email-preview`;
  if (!checkRateLimit(rateLimits, key, 50)) {
    return NextResponse.json({ error: "Rate limit überschritten" }, { status: 429 });
  }

  try {
    const { to, subject, body, type, nummer } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Empfänger, Betreff und Inhalt sind erforderlich" },
        { status: 400 }
      );
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #f8fafc; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MeisterFlow</h1>
      <p>Ihr Handwerksbetrieb</p>
    </div>
    <div class="content">
      ${body.replace(/\n/g, "<br>")}
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von MeisterFlow versendet.</p>
      <p>© 2026 MeisterFlow</p>
    </div>
  </div>
</body>
</html>
    `;

    return NextResponse.json({
      success: true,
      message: "E-Mail bereit zum Versand",
      preview: {
        to,
        subject,
        body: htmlBody,
        textBody: body,
      },
      sendOptions: [
        {
          method: "Gmail öffnen",
          description: "Öffnet Gmail mit vorausgefüllter E-Mail",
        },
        {
          method: "Outlook öffnen",
          description: "Öffnet Outlook mit vorausgefüllter E-Mail",
        },
        {
          method: "Direkt senden",
          description: "Versand über MeisterFlow (Resend)",
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
