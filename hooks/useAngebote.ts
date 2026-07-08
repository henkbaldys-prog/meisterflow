"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Angebot } from "@/types";

export function useAngebote() {
  const [angebote, setAngebote] = useState<Angebot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAngebote();
  }, []);

  const fetchAngebote = async () => {
    const { data, error } = await supabase
      .from("angebote")
      .select("*, kunden(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted = data.map((a: any) => ({
        ...a,
        kunde: a.kunden,
      }));
      setAngebote(formatted as Angebot[]);
    }
    setLoading(false);
  };

  const addAngebot = async (angebot: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Nicht eingeloggt") };

    const { data, error } = await supabase
      .from("angebote")
      .insert([{ ...angebot, user_id: user.id }])
      .select("*, kunden(*)")
      .single();

    if (!error && data) {
      const formatted = { ...data, kunde: data.kunden };
      setAngebote((prev) => [formatted as Angebot, ...prev]);
    }
    return { data, error };
  };

  const updateAngebotStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("angebote").update({ status }).eq("id", id);
    if (!error) {
      setAngebote((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: status as any } : a))
      );
    }
    return { error };
  };

  return { angebote, loading, addAngebot, updateAngebotStatus, fetchAngebote };
}
