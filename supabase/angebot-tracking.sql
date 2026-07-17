-- Angebot-Tracking: Merkt, wann der Kunde das Angebot geöffnet hat
-- Im Supabase SQL Editor ausführen (einmalig).

alter table angebote
  add column if not exists gelesen_am timestamptz default null;

create index if not exists idx_angebote_gelesen_am
  on angebote (user_id, gelesen_am)
  where gelesen_am is null;

-- Öffentlicher Tracking-Zugriff ohne Login (nur gelesen_am setzen + Angebotsdaten lesen)
create or replace function public.open_angebot_tracking(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  update angebote
  set gelesen_am = coalesce(gelesen_am, now())
  where id = p_id;

  if not found then
    return null;
  end if;

  select json_build_object(
    'id', a.id,
    'nummer', a.nummer,
    'betreff', a.betreff,
    'beschreibung', a.beschreibung,
    'netto', a.netto,
    'mwst_satz', a.mwst_satz,
    'brutto', a.brutto,
    'created_at', a.created_at,
    'gueltig_bis', a.gueltig_bis,
    'status', a.status,
    'gelesen_am', a.gelesen_am,
    'kunde', case when k.id is null then null else json_build_object(
      'firma', k.firma,
      'ansprechpartner', k.ansprechpartner,
      'strasse', k.strasse,
      'plz', k.plz,
      'ort', k.ort
    ) end,
    'firma', case when f.id is null then null else json_build_object(
      'firmenname', f.firmenname,
      'strasse', f.strasse,
      'plz', f.plz,
      'ort', f.ort,
      'telefon', f.telefon,
      'email', f.email,
      'standard_angebotstext', f.standard_angebotstext
    ) end
  )
  into result
  from angebote a
  left join kunden k on k.id = a.kunde_id
  left join firmenprofile f on f.user_id = a.user_id
  where a.id = p_id;

  return result;
end;
$$;

revoke all on function public.open_angebot_tracking(uuid) from public;
grant execute on function public.open_angebot_tracking(uuid) to anon, authenticated;
