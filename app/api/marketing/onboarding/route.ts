import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Resend } from "resend";
import {
  getOnboardingMail,
  onboardingMetaKey,
  resolveDueOnboardingMail,
} from "@/lib/marketing";

/**
 * Sendet fällige Onboarding-Mails an den eingeloggten Nutzer (Tag 1 / 3 / 7).
 * Status in user_metadata – keine neue Tabelle nötig.
 */
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ skipped: true, reason: "nicht eingeloggt" });
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const due = resolveDueOnboardingMail(user.created_at, meta);

  if (!due) {
    return NextResponse.json({ skipped: true, reason: "nichts fällig" });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      skipped: true,
      reason: "RESEND_API_KEY fehlt",
      wouldSend: due,
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const name =
    (typeof meta.firmenname === "string" && meta.firmenname) ||
    user.email.split("@")[0];

  const mail = getOnboardingMail(due, { name, appUrl });
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "MeisterFlow <onboarding@resend.dev>",
    to: [user.email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.updateUser({
    data: {
      ...meta,
      [onboardingMetaKey(due)]: true,
      [`${onboardingMetaKey(due)}_at`]: new Date().toISOString(),
    },
  });

  return NextResponse.json({ sent: due });
}
