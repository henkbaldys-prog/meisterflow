"use client";

interface GelesenStatusProps {
  gelesenAm: string | null | undefined;
  /** Nur bei versendeten Angeboten relevant anzeigen */
  show?: boolean;
}

function formatGelesenLabel(gelesenAm: string | null | undefined): {
  label: string;
  opened: boolean;
} {
  if (!gelesenAm) {
    return { label: "Noch nicht geöffnet", opened: false };
  }

  const openedAt = new Date(gelesenAm).getTime();
  const diffMs = Date.now() - openedAt;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  let relative: string;
  if (minutes < 1) relative = "gerade eben";
  else if (minutes < 60) relative = `vor ${minutes} Minute${minutes === 1 ? "" : "n"}`;
  else if (hours < 24) relative = `vor ${hours} Stunde${hours === 1 ? "" : "n"}`;
  else relative = `vor ${days} Tag${days === 1 ? "" : "en"}`;

  return { label: `Geöffnet ${relative}`, opened: true };
}

export default function GelesenStatus({ gelesenAm, show = true }: GelesenStatusProps) {
  if (!show) return null;

  const { label, opened } = formatGelesenLabel(gelesenAm);

  return (
    <span
      className={`mt-1.5 inline-flex items-center gap-1.5 text-xs ${
        opened ? "text-green-400" : "text-dark-500"
      }`}
      title={gelesenAm ? new Date(gelesenAm).toLocaleString("de-DE") : undefined}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          opened ? "bg-green-400" : "bg-dark-600"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
