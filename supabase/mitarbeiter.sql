-- Team-Management (Phase 3)
-- In Supabase SQL Editor ausführen.

CREATE TABLE IF NOT EXISTS mitarbeiter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rolle TEXT NOT NULL DEFAULT 'Geselle',
  telefon TEXT,
  baustelle TEXT,
  heutige_stunden NUMERIC(4,1) NOT NULL DEFAULT 0,
  offene_auftraege INTEGER NOT NULL DEFAULT 0,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mitarbeiter_user ON mitarbeiter (user_id);

ALTER TABLE mitarbeiter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own mitarbeiter" ON mitarbeiter;
CREATE POLICY "Users manage own mitarbeiter"
  ON mitarbeiter FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
