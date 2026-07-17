import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

/** Basis-URL der App (für Tracking-Links in WhatsApp/E-Mail). */
export function getAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

/** Öffentlicher Tracking-Link für ein Angebot. */
export function getAngebotTrackingUrl(angebotId: string, baseUrl?: string): string {
  const base = (baseUrl || getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/api/angebote/track/${angebotId}`;
}

/** Anzeigetext: „Geöffnet vor 2 Stunden“ oder „Noch nicht geöffnet“. */
export function formatGelesenStatus(gelesenAm: string | null | undefined): {
  geöffnet: boolean;
  label: string;
} {
  if (!gelesenAm) {
    return { geöffnet: false, label: "Noch nicht geöffnet" };
  }
  const relativ = formatDistanceToNow(new Date(gelesenAm), {
    addSuffix: true,
    locale: de,
  });
  return { geöffnet: true, label: `Geöffnet ${relativ}` };
}
