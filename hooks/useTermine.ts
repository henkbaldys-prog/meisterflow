"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Termin } from "@/types";

export function useTermine() {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTermine();
  }, []);

  const fetchTermine = async () => {
    const { data, error } = await supabase
      .from("termine")
      .select("*, kunden(*)")
      .order("datum", { ascending: true });

    if (!error && data) {
      const formatted = data.map((t: any) => ({ ...t, kunde: t.kunden }));
      setTermine(formatted as Termin[]);
    }
    setLoading(false);
  };

  const addTermin = async (termin: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Nicht eingeloggt") };

    const { data, error } = await supabase
      .from("termine")
      .insert([{ ...termin, user_id: user.id }])
      .select("*, kunden(*)")
      .single();

    if (!error && data) {
      const formatted = { ...data, kunde: data.kunden };
      setTermine((prev) => [...prev, formatted as Termin].sort((a, b) => 
        new Date(a.datum).getTime() - new Date(b.datum).getTime()
      ));
    }
    return { data, error };
  };

  const updateTerminStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("termine").update({ status }).eq("id", id);
    if (!error) {
      setTermine((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: status as any } : t))
      );
    }
    return { error };
  };

  return { termine, loading, addTermin, updateTerminStatus, fetchTermine };
}
