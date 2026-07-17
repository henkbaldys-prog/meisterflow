-- Feature 2: Follow-up Automatik
-- In Supabase SQL Editor ausführen

create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  angebot_id uuid references angebote(id) on delete cascade not null,
  kunde_id uuid references kunden(id) on delete cascade not null,
  erstellt_am timestamptz default now() not null,
  faellig_am timestamptz not null,
  status text default 'offen' check (status in ('offen', 'erledigt')),
  type text default 'angebot_followup' not null,
  unique (angebot_id)
);

alter table follow_ups enable row level security;

drop policy if exists "Users can only see their own follow_ups" on follow_ups;
create policy "Users can only see their own follow_ups"
  on follow_ups for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_follow_ups_user_id on follow_ups(user_id);
create index if not exists idx_follow_ups_faellig_am on follow_ups(faellig_am);
create index if not exists idx_follow_ups_status on follow_ups(status);
