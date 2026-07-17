-- MeisterFlow Datenbank-Schema

-- Kunden-Tabelle (Name + Telefon reichen; Rest optional)
create table kunden (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  firma text,
  ansprechpartner text,
  email text,
  telefon text,
  strasse text,
  plz text,
  ort text,
  user_id uuid references auth.users not null
);

-- Angebote-Tabelle
create table angebote (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  nummer text not null unique,
  kunde_id uuid references kunden not null,
  betreff text not null,
  beschreibung text not null,
  netto decimal(10,2) not null,
  mwst_satz integer default 19,
  brutto decimal(10,2) not null,
  status text default 'entwurf' check (status in ('entwurf', 'versendet', 'angenommen', 'abgelehnt')),
  user_id uuid references auth.users not null,
  gueltig_bis date not null,
  gelesen_am timestamptz default null
);

-- Rechnungen-Tabelle
create table rechnungen (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  nummer text not null unique,
  kunde_id uuid references kunden not null,
  angebots_id uuid references angebote,
  betreff text not null,
  netto decimal(10,2) not null,
  mwst_satz integer default 19,
  brutto decimal(10,2) not null,
  status text default 'entwurf' check (status in ('entwurf', 'versendet', 'bezahlt', 'ueberfaellig')),
  faellig_am date not null,
  user_id uuid references auth.users not null
);

-- Termine-Tabelle
create table termine (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  titel text not null,
  beschreibung text,
  datum date not null,
  uhrzeit_von time not null,
  uhrzeit_bis time not null,
  kunde_id uuid references kunden,
  ort text,
  status text default 'geplant' check (status in ('geplant', 'bestaetigt', 'abgeschlossen', 'abgesagt')),
  user_id uuid references auth.users not null
);

-- Row Level Security aktivieren
alter table kunden enable row level security;
alter table angebote enable row level security;
alter table rechnungen enable row level security;
alter table termine enable row level security;

-- Policies für Kunden
create policy "Users can only see their own kunden" on kunden
  for select using (auth.uid() = user_id);
create policy "Users can only insert their own kunden" on kunden
  for insert with check (auth.uid() = user_id);
create policy "Users can only update their own kunden" on kunden
  for update using (auth.uid() = user_id);
create policy "Users can only delete their own kunden" on kunden
  for delete using (auth.uid() = user_id);

-- Policies für Angebote
create policy "Users can only see their own angebote" on angebote
  for select using (auth.uid() = user_id);
create policy "Users can only insert their own angebote" on angebote
  for insert with check (auth.uid() = user_id);
create policy "Users can only update their own angebote" on angebote
  for update using (auth.uid() = user_id);
create policy "Users can only delete their own angebote" on angebote
  for delete using (auth.uid() = user_id);

-- Policies für Rechnungen
create policy "Users can only see their own rechnungen" on rechnungen
  for select using (auth.uid() = user_id);
create policy "Users can only insert their own rechnungen" on rechnungen
  for insert with check (auth.uid() = user_id);
create policy "Users can only update their own rechnungen" on rechnungen
  for update using (auth.uid() = user_id);
create policy "Users can only delete their own rechnungen" on rechnungen
  for delete using (auth.uid() = user_id);

-- Policies für Termine
create policy "Users can only see their own termine" on termine
  for select using (auth.uid() = user_id);
create policy "Users can only insert their own termine" on termine
  for insert with check (auth.uid() = user_id);
create policy "Users can only update their own termine" on termine
  for update using (auth.uid() = user_id);
create policy "Users can only delete their own termine" on termine
  for delete using (auth.uid() = user_id);

-- Indizes für bessere Performance
create index idx_kunden_user_id on kunden(user_id);
create index idx_angebote_user_id on angebote(user_id);
create index idx_angebote_kunde_id on angebote(kunde_id);
create index idx_rechnungen_user_id on rechnungen(user_id);
create index idx_rechnungen_kunde_id on rechnungen(kunde_id);
create index idx_termine_user_id on termine(user_id);
create index idx_termine_datum on termine(datum);

-- Firmenprofil-Tabelle
create table if not exists firmenprofile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  firmenname text not null default 'Mein Betrieb',
  logo_url text,
  strasse text,
  plz text,
  ort text,
  telefon text,
  email text,
  gewerke text[] default '{}',
  stundenlohn decimal(10,2) default 45.00,
  anfahrtspauschale decimal(10,2) default 25.00,
  materialaufschlag_prozent integer default 15,
  umsatzsteuer_prozent integer default 19,
  zahlungsziel_tage integer default 14,
  standard_angebotstext text default 'Wir bedanken uns für Ihre Anfrage und unterbreiten Ihnen hiermit unser Angebot.',
  standard_mahnungstext text default 'Wir bitten höflich um Begleichung der offenen Forderung.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table firmenprofile enable row level security;

create policy "Users can only see/edit their own profile" on firmenprofile
  for all using (auth.uid() = user_id);

create index idx_firmenprofile_user_id on firmenprofile(user_id);

-- Angebot-Tracking (gelesen_am + öffentlicher RPC)
create index if not exists idx_angebote_gelesen_am
  on angebote (user_id, gelesen_am)
  where gelesen_am is null;

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
