export interface Kunde {
  id: string;
  created_at: string;
  firma: string | null;
  ansprechpartner: string | null;
  email: string | null;
  telefon: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  user_id: string;
}

export interface Angebot {
  id: string;
  created_at: string;
  nummer: string;
  kunde_id: string;
  betreff: string;
  beschreibung: string;
  netto: number;
  mwst_satz: number;
  brutto: number;
  status: "entwurf" | "versendet" | "angenommen" | "abgelehnt";
  user_id: string;
  gueltig_bis: string;
  kunde?: Kunde;
}

export interface Rechnung {
  id: string;
  created_at: string;
  nummer: string;
  kunde_id: string;
  angebots_id: string | null;
  betreff: string;
  netto: number;
  mwst_satz: number;
  brutto: number;
  status: "entwurf" | "versendet" | "bezahlt" | "ueberfaellig";
  faellig_am: string;
  user_id: string;
  kunde?: Kunde;
}

export interface Termin {
  id: string;
  created_at: string;
  titel: string;
  beschreibung: string;
  datum: string;
  uhrzeit_von: string;
  uhrzeit_bis: string;
  kunde_id: string | null;
  ort: string;
  status: "geplant" | "bestaetigt" | "abgeschlossen" | "abgesagt";
  user_id: string;
  kunde?: Kunde;
}

export interface DashboardStats {
  totalKunden: number;
  totalAngebote: number;
  totalRechnungen: number;
  offeneRechnungen: number;
  umsatzDieserMonat: number;
  angeboteDieserMonat: number;
}

export interface Firmenprofil {
  id: string;
  user_id: string;
  firmenname: string;
  logo_url?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  gewerke?: string[];
  stundenlohn: number;
  anfahrtspauschale: number;
  materialaufschlag_prozent: number;
  umsatzsteuer_prozent: number;
  zahlungsziel_tage: number;
  standard_angebotstext: string;
  standard_mahnungstext: string;
  created_at: string;
  updated_at: string;
}

export interface AngebotInitialData {
  kunde_name?: string | null;
  leistung?: string;
  material?: string;
  menge?: string;
  besonderheiten?: string | null;
  geschätzte_dauer_stunden?: number | null;
  betreff?: string;
  beschreibung?: string;
}

export interface SpracheAngebotData {
  kunde_name: string | null;
  leistung: string;
  material: string;
  menge: string;
  besonderheiten: string | null;
  geschätzte_dauer_stunden: number | null;
  zusammenfassung: string;
}

export interface FotoAngebotData {
  beschreibung: string;
  arbeiten: string[];
  materialien: string[];
  geschätzter_aufwand: string;
  hinweis: string;
  angebotsvorschlag: string;
}
