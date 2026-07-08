"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Rechnung } from "@/types";

export function useRechnungen() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRechnungen();
  }, []);

  const fetchRechnungen = async () => {
    const { data, error } = await supabase
      .from("rechnungen")
      .select("*, kunden(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted = data.map((r: any) => ({ ...r, kunde: r.kunden }));
      setRechnungen(formatted as Rechnung[]);
    }
    setLoading(false);
  };

  const addRechnung = async (rechnung: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Nicht eingeloggt") };

    const { data, error } = await supabase
      .from("rechnungen")
      .insert([{ ...rechnung, user_id: user.id }])
      .select("*, kunden(*)")
      .single();

    if (!error && data) {
      const formatted = { ...data, kunde: data.kunden };
      setRechnungen((prev) => [formatted as Rechnung, ...prev]);
    }
    return { data, error };
  };

  const updateRechnungStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("rechnungen").update({ status }).eq("id", id);
    if (!error) {
      setRechnungen((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as any } : r))
      );
    }
    return { error };
  };

  return { rechnungen, loading, addRechnung, updateRechnungStatus, fetchRechnungen };
}
