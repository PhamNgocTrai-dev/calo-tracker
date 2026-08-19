-- CaloFlow initial schema
-- Apply with the Supabase CLI or paste into the SQL editor of a new project.

create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.goal_status as enum ('active', 'completed', 'cancelled');
create type public.reminder_status as enum ('scheduled', 'completed', 'skipped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  biological_sex text check (biological_sex in ('male', 'female')),
  birth_date date,
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) check (weight_kg between 25 and 350),
  activity_level public.activity_level not null default 'sedentary',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  normalized_name text not null check (char_length(normalized_name) between 1 and 160),
  serving_size_g numeric(8, 2) not null default 100 check (serving_size_g > 0),
  calories_per_100g numeric(8, 2) not null check (calories_per_100g >= 0),
  protein_g_per_100g numeric(8, 2) not null default 0 check (protein_g_per_100g >= 0),
  carbs_g_per_100g numeric(8, 2) not null default 0 check (carbs_g_per_100g >= 0),
  fat_g_per_100g numeric(8, 2) not null default 0 check (fat_g_per_100g >= 0),
  source text not null,
  source_reference text,
  is_verified boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint verified_food_has_no_owner check (not is_verified or created_by is null)
);

create unique index food_items_verified_name_idx
  on public.food_items (normalized_name)
  where is_verified;
create index food_items_search_idx on public.food_items using gin (to_tsvector('simple', name));
create index food_items_created_by_idx on public.food_items (created_by) where created_by is not null;

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_item_id uuid references public.food_items(id) on delete set null,
  meal_type public.meal_type not null,
  food_name_snapshot text not null,
  amount_g numeric(8, 2) not null check (amount_g > 0 and amount_g <= 5000),
  calories_per_100g numeric(8, 2) not null check (calories_per_100g >= 0),
  protein_g_per_100g numeric(8, 2) not null default 0 check (protein_g_per_100g >= 0),
  carbs_g_per_100g numeric(8, 2) not null default 0 check (carbs_g_per_100g >= 0),
  fat_g_per_100g numeric(8, 2) not null default 0 check (fat_g_per_100g >= 0),
  total_calories numeric(10, 2) generated always as (round(amount_g * calories_per_100g / 100, 2)) stored,
  total_protein_g numeric(10, 2) generated always as (round(amount_g * protein_g_per_100g / 100, 2)) stored,
  total_carbs_g numeric(10, 2) generated always as (round(amount_g * carbs_g_per_100g / 100, 2)) stored,
  total_fat_g numeric(10, 2) generated always as (round(amount_g * fat_g_per_100g / 100, 2)) stored,
  eaten_at timestamptz not null default now(),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_entries_user_date_idx on public.meal_entries (user_id, eaten_at desc);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_weight_kg numeric(5, 1) not null check (start_weight_kg between 25 and 350),
  target_weight_kg numeric(5, 1) not null check (target_weight_kg between 25 and 350),
  start_date date not null default current_date,
  target_date date not null check (target_date > start_date),
  estimated_bmr numeric(8, 2) not null check (estimated_bmr > 0),
  estimated_tdee numeric(8, 2) not null check (estimated_tdee > 0),
  daily_calorie_target numeric(8, 2) not null check (daily_calorie_target > 0),
  status public.goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index goals_one_active_per_user_idx on public.goals (user_id) where status = 'active';
create index goals_user_idx on public.goals (user_id, created_at desc);

create table public.workout_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  scheduled_at timestamptz not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  status public.reminder_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_reminders_due_idx
  on public.workout_reminders (user_id, scheduled_at)
  where status = 'scheduled';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger food_items_set_updated_at before update on public.food_items
  for each row execute function public.set_updated_at();
create trigger meal_entries_set_updated_at before update on public.meal_entries
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger workout_reminders_set_updated_at before update on public.workout_reminders
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.food_items enable row level security;
alter table public.meal_entries enable row level security;
alter table public.goals enable row level security;
alter table public.workout_reminders enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "food_items_read_verified_or_own" on public.food_items
  for select using (is_verified or created_by = (select auth.uid()));
create policy "food_items_insert_own" on public.food_items
  for insert with check (created_by = (select auth.uid()) and not is_verified);
create policy "food_items_update_own" on public.food_items
  for update using (created_by = (select auth.uid()) and not is_verified)
  with check (created_by = (select auth.uid()) and not is_verified);
create policy "food_items_delete_own" on public.food_items
  for delete using (created_by = (select auth.uid()) and not is_verified);

create policy "meal_entries_select_own" on public.meal_entries
  for select using (user_id = (select auth.uid()));
create policy "meal_entries_insert_own" on public.meal_entries
  for insert with check (user_id = (select auth.uid()));
create policy "meal_entries_update_own" on public.meal_entries
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "meal_entries_delete_own" on public.meal_entries
  for delete using (user_id = (select auth.uid()));

create policy "goals_select_own" on public.goals
  for select using (user_id = (select auth.uid()));
create policy "goals_insert_own" on public.goals
  for insert with check (user_id = (select auth.uid()));
create policy "goals_update_own" on public.goals
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals_delete_own" on public.goals
  for delete using (user_id = (select auth.uid()));

create policy "workout_reminders_select_own" on public.workout_reminders
  for select using (user_id = (select auth.uid()));
create policy "workout_reminders_insert_own" on public.workout_reminders
  for insert with check (user_id = (select auth.uid()));
create policy "workout_reminders_update_own" on public.workout_reminders
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "workout_reminders_delete_own" on public.workout_reminders
  for delete using (user_id = (select auth.uid()));
