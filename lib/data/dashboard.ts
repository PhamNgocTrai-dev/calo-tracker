import "server-only";

import type { MealListItem } from "@/components/meal-list";
import { getMealTypeLabel, type MealType } from "@/lib/domain/meals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LiveDashboardData = {
  dateLabel: string;
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealCount: number;
  currentWeight: number | null;
  calorieTarget: number | null;
  recentMeals: MealListItem[];
  goal: {
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    targetDate: string;
  } | null;
};

function dateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function getLiveDashboardData(): Promise<LiveDashboardData> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("weight_kg, timezone").maybeSingle();
  const timeZone = profile?.timezone || "Asia/Ho_Chi_Minh";
  const now = new Date();
  const queryStart = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const [goalResult, mealsResult] = await Promise.all([
    supabase
      .from("goals")
      .select("start_weight_kg, target_weight_kg, target_date, daily_calorie_target")
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("meal_entries")
      .select(
        "id, food_name_snapshot, meal_type, total_calories, total_protein_g, total_carbs_g, total_fat_g, eaten_at",
      )
      .gte("eaten_at", queryStart)
      .order("eaten_at", { ascending: false }),
  ]);

  const todayKey = dateKey(now, timeZone);
  const todayMeals = (mealsResult.data ?? []).filter(
    (meal) => dateKey(new Date(meal.eaten_at), timeZone) === todayKey,
  );
  const totals = todayMeals.reduce(
    (current, meal) => ({
      calories: current.calories + Number(meal.total_calories),
      protein: current.protein + Number(meal.total_protein_g),
      carbs: current.carbs + Number(meal.total_carbs_g),
      fat: current.fat + Number(meal.total_fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const currentWeight = profile?.weight_kg == null ? null : Number(profile.weight_kg);
  const activeGoal = goalResult.data;
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    dateLabel: new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }).format(now),
    caloriesConsumed: Math.round(totals.calories),
    proteinG: Math.round(totals.protein * 10) / 10,
    carbsG: Math.round(totals.carbs * 10) / 10,
    fatG: Math.round(totals.fat * 10) / 10,
    mealCount: todayMeals.length,
    currentWeight,
    calorieTarget: activeGoal ? Math.round(Number(activeGoal.daily_calorie_target)) : null,
    recentMeals: todayMeals.slice(0, 5).map((meal) => ({
      id: meal.id,
      name: meal.food_name_snapshot,
      mealType: getMealTypeLabel(meal.meal_type as MealType),
      time: timeFormatter.format(new Date(meal.eaten_at)),
      calories: Math.round(Number(meal.total_calories)),
      protein: Math.round(Number(meal.total_protein_g) * 10) / 10,
    })),
    goal:
      activeGoal && currentWeight !== null
        ? {
            startWeight: Number(activeGoal.start_weight_kg),
            currentWeight,
            targetWeight: Number(activeGoal.target_weight_kg),
            targetDate: dateFormatter.format(new Date(`${activeGoal.target_date}T00:00:00Z`)),
          }
        : null,
  };
}
