"use client";

import { formatGelesenStatus } from "@/lib/angebot-tracking";

interface AngebotGelesenStatusProps {
  gelesenAm: string | null | undefined;
  /** Nur bei versendeten Angeboten sinnvoll anzeigen */
  show?: boolean;
  compact?: boolean;
}

export default function AngebotGelesenStatus({
  gelesenAm,
  show = true,
  compact = false,
}: AngebotGelesenStatusProps) {
  if (!show) return null;

  const { geöffnet, label } = formatGelesenStatus(gelesenAm);

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${compact ? "text-xs" : "text-sm"}`}
      title={label}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          geöffnet ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.55)]" : "bg-dark-600"
        }`}
        aria-hidden
      />
      <span className={geöffnet ? "text-green-400" : "text-dark-500"}>{label}</span>
    </div>
  );
}
