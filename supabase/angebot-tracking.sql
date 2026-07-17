-- Feature 1: Angebot-Tracking
-- In Supabase SQL Editor ausführen

-- 1) Spalte für ersten Öffnungszeitpunkt
alter table angebote
  add column if not exists gelesen_am timestamptz default null;

comment on column angebote.gelesen_am is 'Zeitpunkt, zu dem der Kunde den Tracking-Link erstmals geöffnet hat';

-- 2) Öffentliche Funktion: Öffnung speichern + Angebotsdaten für Ansicht zurückgeben
--    (SECURITY DEFINER, damit Kunden ohne Login tracken können)
create or replace function track_and_get_angebot(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result json;
begin
  -- Ersten Öffnungszeitpunkt setzen (weitere Aufrufe ändern nichts)
  update angebote
  set gelesen_am = coalesce(gelesen_am, now())
  where id = p_id;

  select json_build_object(
    'id', a.id,
    'nummer', a.nummer,
    'betreff', a.betreff,
    'beschreibung', a.beschreibung,
    'netto', a.netto,
    'mwst_satz', a.mwst_satz,
    'brutto', a.brutto,
    'status', a.status,
    'gueltig_bis', a.gueltig_bis,
    'created_at', a.created_at,
    'gelesen_am', a.gelesen_am,
    'kunde', case
      when k.id is null then null
      else json_build_object(
        'firma', k.firma,
        'ansprechpartner', k.ansprechpartner,
        'strasse', k.strasse,
        'plz', k.plz,
        'ort', k.ort
      )
    end,
    'firma', case
      when f.id is null then null
      else json_build_object(
        'firmenname', f.firmenname,
        'strasse', f.strasse,
        'plz', f.plz,
        'ort', f.ort,
        'telefon', f.telefon,
        'email', f.email,
        'standard_angebotstext', f.standard_angebotstext
      )
    end
  )
  into v_result
  from angebote a
  left join kunden k on k.id = a.kunde_id
  left join firmenprofile f on f.user_id = a.user_id
  where a.id = p_id;

  return v_result;
end;
$$;

grant execute on function track_and_get_angebot(uuid) to anon, authenticated;
