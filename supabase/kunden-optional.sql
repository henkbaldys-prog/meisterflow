-- Kunden-Felder optional machen (im Supabase SQL Editor ausführen)
-- Bestehende Daten bleiben erhalten. Neue Kunden brauchen nur Name + Telefon.

ALTER TABLE kunden ALTER COLUMN firma DROP NOT NULL;
ALTER TABLE kunden ALTER COLUMN ansprechpartner DROP NOT NULL;
ALTER TABLE kunden ALTER COLUMN email DROP NOT NULL;
ALTER TABLE kunden ALTER COLUMN strasse DROP NOT NULL;
ALTER TABLE kunden ALTER COLUMN plz DROP NOT NULL;
ALTER TABLE kunden ALTER COLUMN ort DROP NOT NULL;

-- Telefon bleibt optional in DB (alte Kunden ohne Nummer), Frontend verlangt es bei Neuanlage
