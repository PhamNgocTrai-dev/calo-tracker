-- Allow a custom integer amount while keeping the existing quick-add presets.

alter table public.water_entries
  drop constraint if exists water_entries_amount_ml_check;

alter table public.water_entries
  drop constraint if exists water_entries_amount_ml_range_check;

alter table public.water_entries
  add constraint water_entries_amount_ml_range_check
  check (amount_ml between 50 and 2000);
