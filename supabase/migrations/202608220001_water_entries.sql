-- Add per-user water intake entries for the daily dashboard tracker.

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null check (amount_ml in (250, 350, 500)),
  drank_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index water_entries_user_date_idx
  on public.water_entries (user_id, drank_at desc);

alter table public.water_entries enable row level security;

create policy "water_entries_select_own" on public.water_entries
  for select using (user_id = (select auth.uid()));
create policy "water_entries_insert_own" on public.water_entries
  for insert with check (user_id = (select auth.uid()));
create policy "water_entries_delete_own" on public.water_entries
  for delete using (user_id = (select auth.uid()));
