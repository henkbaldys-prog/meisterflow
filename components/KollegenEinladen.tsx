"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { buildKollegenInviteMessage } from "@/lib/marketing";
import toast from "react-hot-toast";

/** Ein-Klick WhatsApp-Einladung an Handwerker-Kollegen */
export default function KollegenEinladen() {
  const { firmenprofil } = useData();
  const [copied, setCopied] = useState(false);

  const message = buildKollegenInviteMessage({
    inviteName: firmenprofil?.firmenname,
  });

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    toast.success("WhatsApp geöffnet – Kollegen einladen");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Einladungstext kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  return (
    <div className="card border-brand-500/20 bg-brand-500/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-200">Kollegen einladen</p>
          <p className="mt-0.5 text-xs text-dark-500">
            MeisterFlow vermarktet sich über dich – fertiger WhatsApp-Text, ein Klick.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openWhatsApp}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-300 hover:bg-green-600/30 sm:flex-none"
          >
            <Share2 className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={copyText}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-dark-800 px-3 py-2 text-sm text-dark-300 hover:bg-dark-700"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : null}
            Kopieren
          </button>
        </div>
      </div>
    </div>
  );
}
