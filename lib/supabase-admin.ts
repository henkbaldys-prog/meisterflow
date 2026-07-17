import { createClient } from "@supabase/supabase-js";

/**
 * Anon-Client für öffentliche Server-Routen (z. B. Angebot-Tracking).
 * Nutzt SECURITY-DEFINER-RPCs – kein Service-Role-Key nötig.
 */
export function createAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase-Umgebungsvariablen fehlen");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
