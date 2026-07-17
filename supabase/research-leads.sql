-- Lead-Recherche (Research only – kein Auto-Versand)
-- In Supabase SQL Editor ausführen

create table if not exists research_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  firma text not null,
  gewerk text not null,
  stadt text not null,
  webseite text,
  email text,
  telefon text,
  status text default 'nicht_kontaktiert'
    check (status in ('nicht_kontaktiert', 'kontaktiert', 'nicht_interessant')),
  text_kurz text,
  text_mittel text,
  text_lang text,
  quelle text default 'KI-Recherche',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table research_leads enable row level security;

drop policy if exists "Users manage own research_leads" on research_leads;
create policy "Users manage own research_leads"
  on research_leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_research_leads_user_id on research_leads(user_id);
create index if not exists idx_research_leads_status on research_leads(status);
