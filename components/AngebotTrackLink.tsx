"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { getAngebotTrackingUrl } from "@/lib/angebot-tracking";
import toast from "react-hot-toast";

interface AngebotTrackLinkProps {
  angebotId: string;
}

/** Kopiert den Tracking-Link zum Teilen mit dem Kunden. */
export default function AngebotTrackLink({ angebotId }: AngebotTrackLinkProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getAngebotTrackingUrl(angebotId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Kunden-Link kopiert – Öffnungen werden getrackt");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  };

  return (
    <button
      onClick={copyLink}
      className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      title="Kunden-Link kopieren (Tracking)"
      type="button"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
    </button>
  );
}
