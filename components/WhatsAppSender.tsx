"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppSenderProps {
  kundenName: string;
  nummer: string;
  betreff: string;
  beschreibung: string;
  brutto: number;
  /** Für Angebot-Tracking-Link */
  angebotId?: string;
}

export default function WhatsAppSender({
  kundenName,
  nummer,
  betreff,
  beschreibung,
  brutto,
  angebotId,
}: WhatsAppSenderProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateMessage = async () => {
    setLoading(true);
    try {
      const trackUrl = angebotId
        ? `${window.location.origin}/api/angebote/track/${angebotId}`
        : "";
      const defaultMessage = `Hallo ${kundenName},\n\nhiermit sende ich Ihnen unser Angebot ${nummer}:\n${betreff}\n\nGesamtbetrag: ${brutto.toFixed(2)} € (inkl. MwSt.)${trackUrl ? `\n\nAngebot öffnen:\n${trackUrl}` : ""}\n\nBei Fragen melden Sie sich gerne.\n\nViele Grüße`;
      setMessage(defaultMessage);
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.message || "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp geöffnet!");
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          generateMessage();
        }}
        disabled={loading}
        className="p-2 text-dark-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors relative z-20"
        title="Per WhatsApp teilen"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
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
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">WhatsApp Nachricht</h2>
                <p className="text-sm text-dark-500">Teile das Angebot direkt per WhatsApp</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Nachricht</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input min-h-[150px] resize-none"
                />
              </div>
            </div>
            <button
              onClick={openWhatsApp}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              WhatsApp öffnen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
