"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Loader2, Mail, MessageCircle } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Rechnung } from "@/types";
import { getKundeName } from "@/lib/kunde-utils";
import {
  buildMahnungMessage,
  buildMahnungSubject,
  daysUntilFaelligDate,
  isRechnungFaelligBald,
  isRechnungUeberfaellig,
  needsMahnung,
} from "@/lib/mahnung";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MahnungDashboardCard() {
  const { rechnungen, firmenprofil, markMahnungGesendet } = useData();
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayISO();

  const { ueberfaellig, faelligBald } = useMemo(() => {
    const ueberfaellig = rechnungen
      .filter((r) => isRechnungUeberfaellig(r, today))
      .sort((a, b) => a.faellig_am.localeCompare(b.faellig_am));
    const faelligBald = rechnungen
      .filter((r) => isRechnungFaelligBald(r, today))
      .sort((a, b) => a.faellig_am.localeCompare(b.faellig_am));
    return { ueberfaellig, faelligBald };
  }, [rechnungen, today]);

  const actionable = useMemo(
    () =>
      [...ueberfaellig, ...faelligBald].filter(
        (r, i, arr) => needsMahnung(r, today) && arr.findIndex((x) => x.id === r.id) === i,
      ),
    [ueberfaellig, faelligBald, today],
  );

  if (ueberfaellig.length === 0 && faelligBald.length === 0) return null;

  const mahnungstext =
    firmenprofil?.standard_mahnungstext ||
    "Wir bitten höflich um Begleichung der offenen Forderung.";
  const firmenname = firmenprofil?.firmenname;

  const sendWhatsApp = async (r: Rechnung) => {
    setBusyId(r.id);
    try {
      const name = r.kunde ? getKundeName(r.kunde) : "Herr/Frau Kunde";
      const text = encodeURIComponent(
        buildMahnungMessage({
          kundenName: name,
          nummer: r.nummer,
          brutto: r.brutto,
          faelligAm: r.faellig_am,
          mahnungstext,
          firmenname,
        }),
      );
      const phone = r.kunde?.telefon?.replace(/\D/g, "") || "";
      window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, "_blank");
      const { error } = await markMahnungGesendet(r.id);
      if (error) toast.error("Mahnung gesendet, Status nicht aktualisiert");
      else toast.success("WhatsApp geöffnet – als gemahnt markiert");
    } finally {
      setBusyId(null);
    }
  };

  const sendEmail = async (r: Rechnung) => {
    const email = r.kunde?.email?.trim();
    if (!email) {
      toast.error("Kunde hat keine E-Mail-Adresse");
      return;
    }
    setBusyId(r.id);
    try {
      const name = r.kunde ? getKundeName(r.kunde) : "Herr/Frau Kunde";
      const text = buildMahnungMessage({
        kundenName: name,
        nummer: r.nummer,
        brutto: r.brutto,
        faelligAm: r.faellig_am,
        mahnungstext,
        firmenname,
      });
      const subject = buildMahnungSubject(r.nummer);
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
      <h1>${firmenname || "MeisterFlow"}</h1>
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

      const { error } = await markMahnungGesendet(r.id);
      if (error) toast.error("E-Mail gesendet, Status nicht aktualisiert");
      else toast.success("Mahnung per E-Mail gesendet");
    } catch (e: any) {
      toast.error(e.message || "E-Mail-Versand fehlgeschlagen");
    } finally {
      setBusyId(null);
    }
  };

  const renderRow = (r: Rechnung, tone: "red" | "yellow") => {
    const name = r.kunde ? getKundeName(r.kunde) : "Unbekannt";
    const days = daysUntilFaelligDate(r.faellig_am, today);
    const busy = busyId === r.id;
    const canMahnen = needsMahnung(r, today);

    return (
      <div
        key={r.id}
        className={`rounded-lg border p-3 ${
          tone === "red" ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={`text-sm font-medium ${tone === "red" ? "text-red-200" : "text-amber-100"}`}>
              {name} · {r.nummer}
            </p>
            <p className="mt-0.5 text-xs text-dark-400">
              {formatCurrency(r.brutto)} · Fällig: {formatDate(r.faellig_am)}
              {days < 0
                ? ` · ${Math.abs(days)} Tag${Math.abs(days) === 1 ? "" : "e"} überfällig`
                : days === 0
                  ? " · Heute fällig"
                  : ` · in ${days} Tag${days === 1 ? "" : "en"}`}
            </p>
          </div>
          {canMahnen && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sendWhatsApp(r)}
                disabled={busy}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-300 hover:bg-green-600/30 disabled:opacity-50 sm:flex-none"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => sendEmail(r)}
                disabled={busy || !r.kunde?.email}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600/20 px-3 py-2 text-sm font-medium text-brand-300 hover:bg-brand-600/30 disabled:opacity-50 sm:flex-none"
                title={!r.kunde?.email ? "Keine E-Mail hinterlegt" : "Mahnung per E-Mail"}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                E-Mail
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card border-red-500/25 bg-red-500/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-200">Mahnungen</p>
            <p className="text-xs text-dark-500">Offene Rechnungen – Geld nicht liegen lassen</p>
          </div>
        </div>
        <Link href="/rechnungen?filter=unbezahlt" className="text-xs text-brand-400 hover:text-brand-300">
          Alle →
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <p className="text-xs font-medium text-red-300">Überfällig</p>
          <p className="text-xl font-bold text-red-100">
            {ueberfaellig.length === 0
              ? "0"
              : `${ueberfaellig.length} Rechnung${ueberfaellig.length === 1 ? "" : "en"}`}
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <p className="text-xs font-medium text-amber-300 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Fällig in ≤ 14 Tagen
          </p>
          <p className="text-xl font-bold text-amber-100">
            {faelligBald.length === 0
              ? "0"
              : `${faelligBald.length} Rechnung${faelligBald.length === 1 ? "" : "en"}`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ueberfaellig.slice(0, 4).map((r) => renderRow(r, "red"))}
        {faelligBald.slice(0, 3).map((r) => renderRow(r, "yellow"))}
        {actionable.length === 0 && (ueberfaellig.length > 0 || faelligBald.length > 0) && (
          <p className="text-xs text-dark-500">
            Nächste Mahnung erst wieder, wenn der 7-Tage-Abstand erreicht ist.
          </p>
        )}
      </div>
    </div>
  );
}
