"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Kunde } from "@/types";

export function useKunden() {
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKunden();
  }, []);

  const fetchKunden = async () => {
    const { data, error } = await supabase
      .from("kunden")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setKunden(data as Kunde[]);
    setLoading(false);
  };

  const addKunde = async (kunde: Omit<Kunde, "id" | "created_at" | "user_id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("Nicht eingeloggt") };

    const { data, error } = await supabase
      .from("kunden")
      .insert([{ ...kunde, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setKunden((prev) => [data as Kunde, ...prev]);
    }
    return { data, error };
  };

  const deleteKunde = async (id: string) => {
    const { error } = await supabase.from("kunden").delete().eq("id", id);
    if (!error) setKunden((prev) => prev.filter((k) => k.id !== id));
    return { error };
  };

  return { kunden, loading, addKunde, deleteKunde, fetchKunden };
}
