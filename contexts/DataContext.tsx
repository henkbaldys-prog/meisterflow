"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Kunde, Angebot, Rechnung, Termin, Firmenprofil } from "@/types";

export type FirmenprofilInput = Omit<Firmenprofil, "id" | "user_id" | "created_at" | "updated_at">;

interface DataContextType {
  kunden: Kunde[];
  angebote: Angebot[];
  rechnungen: Rechnung[];
  termine: Termin[];
  firmenprofil: Firmenprofil | null;
  profilUnvollstaendig: boolean;
  loading: boolean;
  refreshKunden: () => Promise<void>;
  refreshAngebote: () => Promise<void>;
  refreshRechnungen: () => Promise<void>;
  refreshTermine: () => Promise<void>;
  loadFirmenprofil: () => Promise<void>;
  saveFirmenprofil: (data: FirmenprofilInput) => Promise<{ data: Firmenprofil | null; error: any }>;
  addKunde: (kunde: any) => Promise<{ data: any; error: any }>;
  addAngebot: (angebot: any) => Promise<{ data: any; error: any }>;
  addRechnung: (rechnung: any) => Promise<{ data: any; error: any }>;
  addTermin: (termin: any) => Promise<{ data: any; error: any }>;
  deleteKunde: (id: string) => Promise<{ error: any }>;
  updateAngebotStatus: (id: string, status: string) => Promise<{ error: any }>;
  updateRechnungStatus: (id: string, status: string) => Promise<{ error: any }>;
  updateTerminStatus: (id: string, status: string) => Promise<{ error: any }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [angebote, setAngebote] = useState<Angebot[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [termine, setTermine] = useState<Termin[]>([]);
  const [firmenprofil, setFirmenprofil] = useState<Firmenprofil | null>(null);
  const [loading, setLoading] = useState(true);

  const profilUnvollstaendig = useMemo(
    () => !firmenprofil || firmenprofil.firmenname === "Mein Betrieb",
    [firmenprofil],
  );

  const refreshKunden = useCallback(async () => {
    const { data } = await supabase.from("kunden").select("*").order("created_at", { ascending: false });
    if (data) setKunden(data as Kunde[]);
  }, []);

  const refreshAngebote = useCallback(async () => {
    const { data } = await supabase
      .from("angebote")
      .select("*, kunden(*)")
      .order("created_at", { ascending: false });
    if (data) setAngebote(data.map((a: any) => ({ ...a, kunde: a.kunden })) as Angebot[]);
  }, []);

  const refreshRechnungen = useCallback(async () => {
    const { data } = await supabase
      .from("rechnungen")
      .select("*, kunden(*)")
      .order("created_at", { ascending: false });
    if (data) setRechnungen(data.map((r: any) => ({ ...r, kunde: r.kunden })) as Rechnung[]);
  }, []);

  const refreshTermine = useCallback(async () => {
    const { data } = await supabase
      .from("termine")
      .select("*, kunden(*)")
      .order("datum", { ascending: true });
    if (data) setTermine(data.map((t: any) => ({ ...t, kunde: t.kunden })) as Termin[]);
  }, []);

  const loadFirmenprofil = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("firmenprofile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error) {
      setFirmenprofil(data ? (data as Firmenprofil) : null);
    }
  }, []);

  const saveFirmenprofil = useCallback(async (data: FirmenprofilInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Nicht eingeloggt") };

    const { data: result, error } = await supabase
      .from("firmenprofile")
      .upsert(
        {
          ...data,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (!error && result) setFirmenprofil(result as Firmenprofil);
    return { data: result as Firmenprofil | null, error };
  }, []);

  const addKunde = useCallback(async (kunde: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Nicht eingeloggt") };
    const { data, error } = await supabase
      .from("kunden")
      .insert([{ ...kunde, user_id: user.id }])
      .select()
      .single();
    if (!error && data) setKunden((prev) => [data as Kunde, ...prev]);
    return { data, error };
  }, []);

  const addAngebot = useCallback(async (angebot: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Nicht eingeloggt") };
    const { data, error } = await supabase
      .from("angebote")
      .insert([{ ...angebot, user_id: user.id }])
      .select("*, kunden(*)")
      .single();
    if (!error && data) setAngebote((prev) => [{ ...data, kunde: data.kunden } as Angebot, ...prev]);
    return { data, error };
  }, []);

  const addRechnung = useCallback(async (rechnung: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Nicht eingeloggt") };
    const { data, error } = await supabase
      .from("rechnungen")
      .insert([{ ...rechnung, user_id: user.id }])
      .select("*, kunden(*)")
      .single();
    if (!error && data) setRechnungen((prev) => [{ ...data, kunde: data.kunden } as Rechnung, ...prev]);
    return { data, error };
  }, []);

  const addTermin = useCallback(async (termin: any) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Nicht eingeloggt") };
    const { data, error } = await supabase
      .from("termine")
      .insert([{ ...termin, user_id: user.id }])
      .select("*, kunden(*)")
      .single();
    if (!error && data)
      setTermine((prev) =>
        [...prev, { ...data, kunde: data.kunden } as Termin].sort(
          (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime(),
        ),
      );
    return { data, error };
  }, []);

  const deleteKunde = useCallback(async (id: string) => {
    const { error } = await supabase.from("kunden").delete().eq("id", id);
    if (!error) setKunden((prev) => prev.filter((k) => k.id !== id));
    return { error };
  }, []);

  const updateAngebotStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from("angebote").update({ status }).eq("id", id);
    if (!error) setAngebote((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as any } : a)));
    return { error };
  }, []);

  const updateRechnungStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from("rechnungen").update({ status }).eq("id", id);
    if (!error) setRechnungen((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)));
    return { error };
  }, []);

  const updateTerminStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from("termine").update({ status }).eq("id", id);
    if (!error) setTermine((prev) => prev.map((t) => (t.id === id ? { ...t, status: status as any } : t)));
    return { error };
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        refreshKunden(),
        refreshAngebote(),
        refreshRechnungen(),
        refreshTermine(),
        loadFirmenprofil(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [refreshKunden, refreshAngebote, refreshRechnungen, refreshTermine, loadFirmenprofil]);

  return (
    <DataContext.Provider
      value={{
        kunden,
        angebote,
        rechnungen,
        termine,
        firmenprofil,
        profilUnvollstaendig,
        loading,
        refreshKunden,
        refreshAngebote,
        refreshRechnungen,
        refreshTermine,
        loadFirmenprofil,
        saveFirmenprofil,
        addKunde,
        addAngebot,
        addRechnung,
        addTermin,
        deleteKunde,
        updateAngebotStatus,
        updateRechnungStatus,
        updateTerminStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData muss innerhalb von DataProvider verwendet werden");
  return context;
}
