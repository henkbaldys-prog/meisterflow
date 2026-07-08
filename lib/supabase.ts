import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      kunden: {
        Row: {
          id: string;
          created_at: string;
          firma: string;
          ansprechpartner: string;
          email: string;
          telefon: string;
          strasse: string;
          plz: string;
          ort: string;
          user_id: string;
        };
      };
      angebote: {
        Row: {
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
        };
      };
      rechnungen: {
        Row: {
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
        };
      };
      termine: {
        Row: {
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
        };
      };
    };
  };
};
