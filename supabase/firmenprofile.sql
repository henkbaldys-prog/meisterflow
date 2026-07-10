-- Firmenprofil-Tabelle (im Supabase SQL Editor ausführen)
-- Wenn die Tabelle schon existiert, werden nur fehlende Objekte angelegt.

CREATE TABLE IF NOT EXISTS firmenprofile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  firmenname TEXT NOT NULL DEFAULT 'Mein Betrieb',
  logo_url TEXT,
  strasse TEXT,
  plz TEXT,
  ort TEXT,
  telefon TEXT,
  email TEXT,
  gewerke TEXT[] DEFAULT '{}',
  stundenlohn DECIMAL(10,2) DEFAULT 45.00,
  anfahrtspauschale DECIMAL(10,2) DEFAULT 25.00,
  materialaufschlag_prozent INTEGER DEFAULT 15,
  umsatzsteuer_prozent INTEGER DEFAULT 19,
  zahlungsziel_tage INTEGER DEFAULT 14,
  standard_angebotstext TEXT DEFAULT 'Wir bedanken uns für Ihre Anfrage und unterbreiten Ihnen hiermit unser Angebot.',
  standard_mahnungstext TEXT DEFAULT 'Wir bitten höflich um Begleichung der offenen Forderung.',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE firmenprofile ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'firmenprofile'
      AND policyname = 'Users can only see/edit their own profile'
  ) THEN
    CREATE POLICY "Users can only see/edit their own profile"
      ON firmenprofile FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_firmenprofile_user_id ON firmenprofile(user_id);
