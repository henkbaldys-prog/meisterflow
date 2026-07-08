"use client";

import { useState } from "react";
import { Mail, Send, Copy, Check, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

interface EmailSenderProps {
  to: string;
  kundenName: string;
  type: "angebot" | "rechnung";
  nummer: string;
  betreff: string;
  beschreibung: string;
  brutto: number;
}

export default function EmailSender({
  to,
  kundenName,
  type,
  nummer,
  betreff,
  beschreibung,
  brutto,
}: EmailSenderProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const generateEmail = async () => {
    setLoading(true);
    try {
      const isAngebot = type === "angebot";
      const defaultSubject = isAngebot
        ? `Angebot ${nummer}: ${betreff}`
        : `Rechnung ${nummer}: ${betreff}`;

      const defaultBody = isAngebot
        ? `Sehr geehrte/r ${kundenName},

hiermit übersende ich Ihnen unser Angebot ${nummer}.

${betreff}

${beschreibung}

Gesamtbetrag: ${brutto.toFixed(2)} € (inkl. MwSt.)

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

      setSubject(defaultSubject);
      setBody(defaultBody);

      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject: defaultSubject,
          body: defaultBody,
          type,
          nummer,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setEmailData(data);
      setShowModal(true);
      toast.success("E-Mail vorbereitet!");
    } catch (error: any) {
      toast.error(error.message || "Fehler beim Vorbereiten");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullEmail = `An: ${to}
Betreff: ${subject}

${body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("E-Mail kopiert!");
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Text kopiert!");
  };

  const openGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  const openOutlook = () => {
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(outlookUrl, "_blank");
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
          <div className="card w-full max-w-lg relative">
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
                <p className="text-sm text-dark-500">Kostenlos über dein bestehendes E-Mail-Konto</p>
              </div>
            </div>

            {/* E-Mail Vorschau */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">An</label>
                <input type="text" value={to} readOnly className="input bg-dark-900" />
              </div>
              <div>
                <label className="label">Betreff</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Nachricht</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input min-h-[150px] resize-none"
                />
              </div>
            </div>

            {/* Versand-Optionen */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-dark-400 mb-2">Wähle, wie du senden möchtest:</p>

              <button
                onClick={openGmail}
                className="w-full flex items-center gap-3 p-3 bg-dark-900 hover:bg-dark-800 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-red-400 font-bold text-sm">G</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Gmail öffnen</p>
                  <p className="text-xs text-dark-500">Öffnet Gmail mit vorausgefüllter E-Mail</p>
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
                  <p className="text-xs text-dark-500">Öffnet Outlook mit vorausgefüllter E-Mail</p>
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
                  <p className="text-xs text-dark-500">Füge es in dein E-Mail-Programm ein</p>
                </div>
              </button>
            </div>

            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                <strong>Tipp:</strong> Für automatischen Versand kannst du später Gmail SMTP einrichten (kostenlos).
                Bis dahin reicht das Kopieren & Einfügen vollkommen aus.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
