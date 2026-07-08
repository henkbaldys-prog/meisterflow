-- MeisterFlow Datenbank-Schema

-- Kunden-Tabelle
create table kunden (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  firma text not null,
  ansprechpartner text not null,
  email text not null,
  telefon text,
  strasse text not null,
  plz text not null,
  ort text not null,
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
  gueltig_bis date not null
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
