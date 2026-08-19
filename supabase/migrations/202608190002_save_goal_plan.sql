-- Atomically replace the authenticated user's active goal and update their profile.

create or replace function public.save_goal_plan(
  p_biological_sex text,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_activity_level public.activity_level,
  p_target_weight_kg numeric,
  p_target_date date,
  p_estimated_bmr numeric,
  p_estimated_tdee numeric,
  p_daily_calorie_target numeric
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_goal_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_biological_sex not in ('male', 'female') then
    raise exception 'Invalid biological sex';
  end if;

  update public.profiles
  set
    biological_sex = p_biological_sex,
    height_cm = p_height_cm,
    weight_kg = p_weight_kg,
    activity_level = p_activity_level
  where id = current_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  update public.goals
  set status = 'cancelled'
  where user_id = current_user_id
    and status = 'active';

  insert into public.goals (
    user_id,
    start_weight_kg,
    target_weight_kg,
    start_date,
    target_date,
    estimated_bmr,
    estimated_tdee,
    daily_calorie_target,
    status
  )
  values (
    current_user_id,
    p_weight_kg,
    p_target_weight_kg,
    current_date,
    p_target_date,
    p_estimated_bmr,
    p_estimated_tdee,
    p_daily_calorie_target,
    'active'
  )
  returning id into new_goal_id;

  return new_goal_id;
end;
$$;

revoke all on function public.save_goal_plan(text, numeric, numeric, public.activity_level, numeric, date, numeric, numeric, numeric) from public;
revoke all on function public.save_goal_plan(text, numeric, numeric, public.activity_level, numeric, date, numeric, numeric, numeric) from anon;
grant execute on function public.save_goal_plan(text, numeric, numeric, public.activity_level, numeric, date, numeric, numeric, numeric) to authenticated;
