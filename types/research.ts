export type ResearchLeadStatus = "nicht_kontaktiert" | "kontaktiert" | "nicht_interessant";

export type ResearchLead = {
  id: string;
  user_id: string;
  firma: string;
  gewerk: string;
  stadt: string;
  webseite: string | null;
  email: string | null;
  telefon: string | null;
  status: ResearchLeadStatus;
  text_kurz: string | null;
  text_mittel: string | null;
  text_lang: string | null;
  quelle: string;
  created_at: string;
  updated_at: string;
};

export type ResearchLeadInput = {
  firma: string;
  gewerk: string;
  stadt: string;
  webseite?: string | null;
  email?: string | null;
  telefon?: string | null;
  text_kurz?: string | null;
  text_mittel?: string | null;
  text_lang?: string | null;
  quelle?: string;
};

export function normalizePublicEmail(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/keine öffentliche e-mail|nicht öffentlich/i.test(s)) return null;
  if (!s.includes("@")) return null;
  return s;
}

export function normalizeUrl(value: unknown): string | null {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s || s === "-" || /unbekannt|keine/i.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    new URL(s);
    return s;
  } catch {
    return null;
  }
}
