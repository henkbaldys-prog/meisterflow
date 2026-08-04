-- Website-Builder für Handwerker (Phase 2)
-- In Supabase SQL Editor ausführen.

CREATE TABLE IF NOT EXISTS handwerker_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subdomain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'entwurf'
    CHECK (status IN ('entwurf', 'veroeffentlicht')),
  template TEXT NOT NULL DEFAULT 'modern'
    CHECK (template IN ('modern', 'klassisch', 'minimalistisch')),
  farbe_primary TEXT NOT NULL DEFAULT '#6366F1',
  seo_titel TEXT,
  seo_beschreibung TEXT,
  impressum TEXT,
  datenschutz TEXT,
  hero_headline TEXT,
  hero_subheadline TEXT,
  ueber_uns TEXT,
  leistungen TEXT[] DEFAULT '{}',
  -- Öffentliche Snapshot-Felder (kein RLS-Leak auf firmenprofile)
  firmenname TEXT,
  telefon TEXT,
  email TEXT,
  ort TEXT,
  logo_url TEXT,
  slogan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handwerker_websites_subdomain
  ON handwerker_websites (subdomain)
  WHERE subdomain IS NOT NULL;

CREATE TABLE IF NOT EXISTS website_anfragen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES handwerker_websites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  nachricht TEXT NOT NULL,
  gelesen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_website_anfragen_user_unread
  ON website_anfragen (user_id, gelesen, created_at DESC);

ALTER TABLE handwerker_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_anfragen ENABLE ROW LEVEL SECURITY;

-- Owner: volle Kontrolle
DROP POLICY IF EXISTS "Users manage own website" ON handwerker_websites;
CREATE POLICY "Users manage own website"
  ON handwerker_websites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Öffentlich: nur veröffentlichte Sites lesen
DROP POLICY IF EXISTS "Public read published websites" ON handwerker_websites;
CREATE POLICY "Public read published websites"
  ON handwerker_websites FOR SELECT
  USING (status = 'veroeffentlicht');

-- Owner: Anfragen lesen/aktualisieren
DROP POLICY IF EXISTS "Users manage own anfragen" ON website_anfragen;
CREATE POLICY "Users manage own anfragen"
  ON website_anfragen FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Öffentlich: Anfrage an veröffentlichte Website
DROP POLICY IF EXISTS "Public insert anfragen on published" ON website_anfragen;
CREATE POLICY "Public insert anfragen on published"
  ON website_anfragen FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM handwerker_websites w
      WHERE w.id = website_id
        AND w.user_id = website_anfragen.user_id
        AND w.status = 'veroeffentlicht'
    )
  );
