import { getAppBaseUrl } from "@/lib/angebot-tracking";

export function buildKollegenInviteMessage(opts?: { inviteName?: string }): string {
  const base = getAppBaseUrl();
  const name = opts?.inviteName?.trim();
  const from = name ? `Ich (${name}) nutze` : "Ich nutze";
  return `${from} MeisterFlow für Angebote, Nachfassen und Mahnungen – spart mir richtig Zeit im Büro.

Probier's kostenlos: ${base}?ref=kollege`;
}

export type OnboardingMailKey = "day1" | "day3" | "day7";

export function getOnboardingMail(
  key: OnboardingMailKey,
  opts: { name?: string; appUrl: string },
): { subject: string; text: string; html: string } {
  const name = opts.name?.trim() || "Handwerker";
  const url = opts.appUrl.replace(/\/$/, "");

  const templates: Record<OnboardingMailKey, { subject: string; text: string }> = {
    day1: {
      subject: "Willkommen bei MeisterFlow – so startest du",
      text: `Hallo ${name},

willkommen bei MeisterFlow.

Heute in 2 Minuten:
1. Kunden anlegen
2. Erstes Angebot erstellen
3. Per WhatsApp senden (Tracking-Link inklusive)

Dann siehst du, ob der Kunde geöffnet hat.

Loslegen: ${url}/angebote

Viel Erfolg
Dein MeisterFlow-Team`,
    },
    day3: {
      subject: "Tipp: Nachfassen, bevor Aufträge versanden",
      text: `Hallo ${name},

kleiner Tipp für mehr Aufträge:

Wenn ein Angebot 3 Tage offen ist, erinnert dich MeisterFlow automatisch zum Nachfassen – per WhatsApp oder E-Mail, mit fertigem Text.

Dashboard öffnen: ${url}/dashboard

Viele Grüße
MeisterFlow`,
    },
    day7: {
      subject: "Kein Geld liegen lassen – Mahnungen automatisch",
      text: `Hallo ${name},

offene Rechnungen kosten Nerven und Geld.

MeisterFlow zeigt überfällige Rechnungen oben im Dashboard und lässt dich mit einem Klick mahnen (WhatsApp oder E-Mail). Nach der Mahnung kommt die nächste Erinnerung in 7 Tagen.

Rechnungen prüfen: ${url}/rechnungen

Beste Grüße
MeisterFlow`,
    },
  };

  const t = templates[key];
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
  <div style="max-width:560px;margin:0 auto;padding:20px">
    <div style="background:#2563eb;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
      <strong>MeisterFlow</strong>
    </div>
    <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
      ${t.text.replace(/\n/g, "<br>")}
    </div>
  </div>
</body></html>`;

  return { subject: t.subject, text: t.text, html };
}

/** Welche Onboarding-Mail ist heute fällig? */
export function resolveDueOnboardingMail(
  createdAt: string,
  meta: Record<string, unknown>,
  now = new Date(),
): OnboardingMailKey | null {
  const created = new Date(createdAt);
  const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  if (days >= 7 && !meta.onboarding_day7_sent) return "day7";
  if (days >= 3 && !meta.onboarding_day3_sent) return "day3";
  if (days >= 0 && !meta.onboarding_day1_sent) return "day1";
  return null;
}

export function onboardingMetaKey(key: OnboardingMailKey): string {
  if (key === "day1") return "onboarding_day1_sent";
  if (key === "day3") return "onboarding_day3_sent";
  return "onboarding_day7_sent";
}
