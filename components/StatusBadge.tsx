"use client";

const statusConfig: Record<string, { label: string; className: string }> = {
  entwurf: { label: "Entwurf", className: "badge-yellow" },
  versendet: { label: "Versendet", className: "badge-blue" },
  angenommen: { label: "Angenommen", className: "badge-green" },
  abgelehnt: { label: "Abgelehnt", className: "badge-red" },
  bezahlt: { label: "Bezahlt", className: "badge-green" },
  ueberfaellig: { label: "Überfällig", className: "badge-red" },
  gemahnt: { label: "Gemahnt", className: "badge-yellow" },
  geplant: { label: "Geplant", className: "badge-yellow" },
  bestaetigt: { label: "Bestätigt", className: "badge-blue" },
  abgeschlossen: { label: "Abgeschlossen", className: "badge-green" },
  abgesagt: { label: "Abgesagt", className: "badge-red" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "badge-purple" };
  return (
    <span
      className={`badge ${config.className} relative z-20 pointer-events-auto`}
      style={{ pointerEvents: "auto", position: "relative", zIndex: 20 }}
    >
      {config.label}
    </span>
  );
}
