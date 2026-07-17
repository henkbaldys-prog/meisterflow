"use client";

import { useState } from "react";
import { MessageCircle, Mail, Loader2, CheckCircle2, Bell } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { FollowUp } from "@/types";
import { getKundeName } from "@/lib/kunde-utils";
import {
  buildFollowUpMessage,
  buildFollowUpEmailSubject,
  formatFollowUpFaelligLabel,
  formatAngebotVom,
  daysUntilFaellig,
} from "@/lib/follow-up";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface FollowUpDashboardCardProps {
  followUps: FollowUp[];
}

export default function FollowUpDashboardCard({ followUps }: FollowUpDashboardCardProps) {
  const { completeFollowUp } = useData();
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = followUps.filter((f) => f.status === "offen");
  if (open.length === 0) return null;

  const dueOrSoon = [...open].sort(
    (a, b) => new Date(a.faellig_am).getTime() - new Date(b.faellig_am).getTime(),
  );

  const sendWhatsApp = async (fu: FollowUp) => {
    setBusyId(fu.id);
    try {
      const name = fu.kunde ? getKundeName(fu.kunde) : "Herr/Frau Kunde";
      const text = encodeURIComponent(buildFollowUpMessage(name));
      const phone = fu.kunde?.telefon?.replace(/\D/g, "") || "";
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(url, "_blank");
      const { error } = await completeFollowUp(fu.id);
      if (error) toast.error("Follow-up konnte nicht als erledigt markiert werden");
      else toast.success("WhatsApp geöffnet – Follow-up erledigt");
    } finally {
      setBusyId(null);
    }
  };

  const sendEmail = async (fu: FollowUp) => {
    const email = fu.kunde?.email?.trim();
    if (!email) {
      toast.error("Kunde hat keine E-Mail-Adresse");
      return;
    }

    setBusyId(fu.id);
    try {
      const name = fu.kunde ? getKundeName(fu.kunde) : "Herr/Frau Kunde";
      const subject = buildFollowUpEmailSubject(fu.angebot?.nummer);
      const text = buildFollowUpMessage(name);
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
      <h1>MeisterFlow</h1>
    </div>
    <div style="background: #f8fafc; padding: 30px; margin: 20px 0;">
      ${text.replace(/\n/g, "<br>")}
    </div>
  </div>
</body>
</html>`;

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: email, subject, html, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Versand fehlgeschlagen");

      const { error } = await completeFollowUp(fu.id);
      if (error) toast.error("E-Mail gesendet, Follow-up-Status nicht aktualisiert");
      else toast.success("Erinnerung per E-Mail gesendet");
    } catch (e: any) {
      toast.error(e.message || "E-Mail-Versand fehlgeschlagen");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card border-brand-500/25 bg-brand-500/5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10">
          <Bell className="h-5 w-5 text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-200">
            {open.length === 1 ? "1 offenes Follow-up" : `${open.length} offene Follow-ups`}
          </p>
          <p className="text-xs text-dark-500">Automatisch 3 Tage nach Versand</p>
        </div>
      </div>

      <div className="space-y-3">
        {dueOrSoon.slice(0, 5).map((fu) => {
          const name = fu.kunde ? getKundeName(fu.kunde) : "Unbekannt";
          const days = daysUntilFaellig(fu.faellig_am);
          const overdue = days <= 0;
          const label = formatFollowUpFaelligLabel(fu.faellig_am);
          const angebotLabel = formatAngebotVom(fu.angebot?.created_at);
          const busy = busyId === fu.id;

          return (
            <div
              key={fu.id}
              className={`rounded-lg border p-3 ${
                overdue
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-dark-700 bg-dark-900"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${overdue ? "text-red-300" : "text-white"}`}>
                    {overdue || days === 0
                      ? `Heute nachfassen bei: ${name}`
                      : `${label} bei: ${name}`}
                  </p>
                  <p className="mt-0.5 text-xs text-dark-500">
                    {[angebotLabel, fu.angebot?.nummer, fu.angebot ? formatCurrency(fu.angebot.brutto) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className={`mt-1 text-xs font-medium ${overdue ? "text-red-400" : "text-brand-400"}`}>
                    {label}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => sendWhatsApp(fu)}
                    disabled={busy}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-300 transition-colors hover:bg-green-600/30 disabled:opacity-50 sm:flex-none"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => sendEmail(fu)}
                    disabled={busy || !fu.kunde?.email}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-sm font-medium text-brand-300 transition-colors hover:bg-brand-600/30 disabled:opacity-50 sm:flex-none"
                    title={!fu.kunde?.email ? "Keine E-Mail hinterlegt" : "Erinnerung per E-Mail"}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    E-Mail
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setBusyId(fu.id);
                      const { error } = await completeFollowUp(fu.id);
                      setBusyId(null);
                      if (error) toast.error("Fehler");
                      else toast.success("Als erledigt markiert");
                    }}
                    disabled={busy}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 py-2 text-dark-500 hover:bg-dark-800 hover:text-green-400 disabled:opacity-50"
                    title="Als erledigt markieren"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
