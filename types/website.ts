export type WebsiteTemplate = "modern" | "klassisch" | "minimalistisch";
export type WebsiteStatus = "entwurf" | "veroeffentlicht";

export type HandwerkerWebsite = {
  id: string;
  user_id: string;
  subdomain: string | null;
  status: WebsiteStatus;
  template: WebsiteTemplate;
  farbe_primary: string;
  seo_titel: string | null;
  seo_beschreibung: string | null;
  impressum: string | null;
  datenschutz: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  ueber_uns: string | null;
  leistungen: string[] | null;
  firmenname: string | null;
  telefon: string | null;
  email: string | null;
  ort: string | null;
  logo_url: string | null;
  slogan: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteAnfrage = {
  id: string;
  website_id: string;
  user_id: string;
  name: string;
  telefon: string | null;
  email: string | null;
  nachricht: string;
  gelesen: boolean;
  created_at: string;
};

export type WebsiteKiTexte = {
  hero_headline: string;
  hero_subheadline: string;
  ueber_uns: string;
  leistungen: string[];
  seo_beschreibung: string;
};

export function slugifySubdomain(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
