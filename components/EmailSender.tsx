"use client";

import { useState } from "react";
import { Mail, Send, Copy, Check, Loader2, X } from "lucide-react";
import { getAngebotTrackingUrl } from "@/lib/angebot-tracking";
import { useData } from "@/contexts/DataContext";
import toast from "react-hot-toast";

interface EmailSenderProps {
  to: string;
  kundenName: string;
  type: "angebot" | "rechnung";
  nummer: string;
  betreff: string;
  beschreibung: string;
  brutto: number;
  /** Wenn gesetzt, wird der Tracking-Link in die Nachricht eingefügt */
  angebotId?: string;
  kundeId?: string;
}

export default function EmailSender({
  to,
  kundenName,
  type,
  nummer,
  betreff,
  beschreibung,
  brutto,
  angebotId,
  kundeId,
}: EmailSenderProps) {
  const { ensureFollowUpForAngebot } = useData();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const maybeCreateFollowUp = async () => {
    if (type === "angebot" && angebotId && kundeId) {
      await ensureFollowUpForAngebot(angebotId, kundeId);
    }
  };

  const buildDefaultContent = () => {
    const isAngebot = type === "angebot";
    const defaultSubject = isAngebot
      ? `Angebot ${nummer}: ${betreff}`
      : `Rechnung ${nummer}: ${betreff}`;

    const trackingLine =
      isAngebot && angebotId
        ? `\n\nAngebot online öffnen:\n${getAngebotTrackingUrl(angebotId)}`
        : "";

    const defaultBody = isAngebot
      ? `Sehr geehrte/r ${kundenName},

hiermit übersende ich Ihnen unser Angebot ${nummer}.

${betreff}

${beschreibung}

Gesamtbetrag: ${brutto.toFixed(2)} € (inkl. MwSt.)${trackingLine}

Das Angebot ist 30 Tage gültig. Bei Fragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Team von MeisterFlow`
      : `Sehr geehrte/r ${kundenName},

hiermit übersende ich Ihnen unsere Rechnung ${nummer}.

${betreff}

Gesamtbetrag: ${brutto.toFixed(2)} € (inkl. MwSt.)

Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf das angegebene Konto.

Mit freundlichen Grüßen
Ihr Team von MeisterFlow`;

    return { defaultSubject, defaultBody };
  };

  const generateEmail = async () => {
    setLoading(true);
    try {
      const { defaultSubject, defaultBody } = buildDefaultContent();
      setSubject(defaultSubject);
      setBody(defaultBody);

      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to,
          subject: defaultSubject,
          body: defaultBody,
          type,
          nummer,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Fehler beim Vorbereiten");

      setShowModal(true);
      toast.success("E-Mail vorbereitet!");
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Vorbereiten");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
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
      ${body.replace(/\n/g, "<br>")}
    </div>
  </div>
</body>
</html>`;

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          to,
          subject,
          html,
          text: body,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Versand fehlgeschlagen");

      await maybeCreateFollowUp();
      toast.success("E-Mail gesendet!");
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || "E-Mail-Versand fehlgeschlagen");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    const fullEmail = `An: ${to}\nBetreff: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("E-Mail kopiert!");
  };

  const openGmail = async () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
    await maybeCreateFollowUp();
  };

  const openOutlook = async () => {
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(outlookUrl, "_blank");
    await maybeCreateFollowUp();
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          generateEmail();
        }}
        disabled={loading}
        className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
        title="Per E-Mail senden"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-dark-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">E-Mail versenden</h2>
                <p className="text-sm text-dark-500">Direkt senden oder in Mail-App öffnen</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label">An</label>
                <input type="text" value={to} readOnly className="input bg-dark-900 w-full" />
              </div>
              <div>
                <label className="label">Betreff</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Nachricht</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input min-h-[150px] resize-none w-full"
                />
              </div>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="btn-primary w-full justify-center mb-4 py-3"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Per E-Mail senden
                </>
              )}
            </button>

            <div className="space-y-3">
              <p className="text-sm font-medium text-dark-400 mb-2">Oder in Mail-App öffnen:</p>

              <button
                onClick={openGmail}
                className="w-full flex items-center gap-3 p-3 bg-dark-900 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-red-400 font-bold text-sm">G</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Gmail öffnen</p>
                  <p className="text-xs text-dark-500">In Mail-App öffnen</p>
                </div>
              </button>

              <button
                onClick={openOutlook}
                className="w-full flex items-center gap-3 p-3 bg-dark-900 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">O</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Outlook öffnen</p>
                  <p className="text-xs text-dark-500">In Mail-App öffnen</p>
                </div>
              </button>

              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 p-3 bg-dark-900 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {copied ? "Kopiert!" : "In Zwischenablage kopieren"}
                  </p>
                  <p className="text-xs text-dark-500">Manuell einfügen</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
