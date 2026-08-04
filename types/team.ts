export type Mitarbeiter = {
  id: string;
  user_id: string;
  name: string;
  rolle: string;
  telefon: string | null;
  baustelle: string | null;
  heutige_stunden: number;
  offene_auftraege: number;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
};

export type MitarbeiterInput = {
  name: string;
  rolle?: string;
  telefon?: string | null;
  baustelle?: string | null;
  heutige_stunden?: number;
  offene_auftraege?: number;
  aktiv?: boolean;
};
