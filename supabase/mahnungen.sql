-- Feature 3: Automatische Mahnungen
-- In Supabase SQL Editor ausführen

-- Status "gemahnt" erlauben
alter table rechnungen drop constraint if exists rechnungen_status_check;
alter table rechnungen
  add constraint rechnungen_status_check
  check (status in ('entwurf', 'versendet', 'bezahlt', 'ueberfaellig', 'gemahnt'));

-- Letzte Mahnung + nächster Mahnungstermin (7 Tage nach Versand)
alter table rechnungen
  add column if not exists gemahnt_am timestamptz default null;

alter table rechnungen
  add column if not exists naechste_mahnung_am date default null;

comment on column rechnungen.gemahnt_am is 'Zeitpunkt der letzten Mahnung';
comment on column rechnungen.naechste_mahnung_am is 'Nächster Mahnungstermin (typisch +7 Tage)';
