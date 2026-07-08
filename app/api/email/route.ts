import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, type, nummer } = await req.json();

    // Validierung
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Empfänger, Betreff und Inhalt sind erforderlich" },
        { status: 400 }
      );
    }

    // E-Mail-Template erstellen
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
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MeisterFlow</h1>
      <p>Ihr Handwerksbetrieb</p>
    </div>
    <div class="content">
      ${body.replace(/\n/g, '<br>')}
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
          method: "Gmail SMTP (kostenlos)",
          description: "Nutze dein Gmail-Konto als SMTP-Server",
          setup: "Aktiviere 'Weniger sichere Apps' oder erstelle ein App-Passwort",
          smtp: "smtp.gmail.com:587",
        },
        {
          method: "Outlook SMTP (kostenlos)",
          description: "Nutze dein Outlook/Hotmail-Konto",
          setup: "Aktiviere SMTP in den Einstellungen",
          smtp: "smtp-mail.outlook.com:587",
        },
        {
          method: "Manuell kopieren",
          description: "Kopiere den E-Mail-Text und sende ihn selbst",
          setup: "Keine Einrichtung nötig",
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
