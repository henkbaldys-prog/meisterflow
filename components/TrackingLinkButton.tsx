"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { getAngebotTrackUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface TrackingLinkButtonProps {
  angebotId: string;
}

export default function TrackingLinkButton({ angebotId }: TrackingLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getAngebotTrackUrl(angebotId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tracking-Link kopiert – Kunde öffnet, du siehst es!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  };

  return (
    <button
      onClick={copyLink}
      className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
      title="Kunden-Link kopieren (mit Öffnungs-Tracking)"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
    </button>
  );
}
