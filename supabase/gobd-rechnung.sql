-- GoBD / Rechnungs-Einstellungen (Phase Fokus)
-- Im Supabase SQL Editor ausführen.

ALTER TABLE firmenprofile
  ADD COLUMN IF NOT EXISTS inhaber_name TEXT,
  ADD COLUMN IF NOT EXISTS steuernummer TEXT,
  ADD COLUMN IF NOT EXISTS ust_id TEXT,
  ADD COLUMN IF NOT EXISTS rechnungsnummer_prefix TEXT DEFAULT 'RE-',
  ADD COLUMN IF NOT EXISTS naechste_rechnungsnummer INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bankverbindung TEXT,
  ADD COLUMN IF NOT EXISTS rechnungshinweis TEXT DEFAULT 'Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist.';
