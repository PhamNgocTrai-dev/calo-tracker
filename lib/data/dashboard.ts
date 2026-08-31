import "server-only";

import type { MealListItem } from "@/components/meal-list";
import { calculateBmi, type BmiResult } from "@/lib/domain/calorie";
import { getDateKey, resolveTimeZone } from "@/lib/domain/dates";
import { getMealTypeLabel, type MealType } from "@/lib/domain/meals";
import { DAILY_WATER_TARGET_ML, calculateWaterProgress } from "@/lib/domain/water";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardWaterEntry = {
  id: string;
  amountMl: number;
  time: string;
};

export type DashboardWater = {
  targetMl: number;
  totalMl: number;
  remainingMl: number;
  percentage: number;
  entries: DashboardWaterEntry[];
};

export type LiveDashboardData = {
  dateLabel: string;
  caloriesConsumed: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealCount: number;
  currentWeight: number | null;
  bmi: BmiResult | null;
  calorieTarget: number | null;
  recentMeals: MealListItem[];
  water: DashboardWater;
  goal: {
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    targetDate: string;
  } | null;
};

export async function getLiveDashboardData(): Promise<LiveDashboardData> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("height_cm, weight_kg, timezone")
    .maybeSingle();
  const timeZone = resolveTimeZone(profile?.timezone);
  const now = new Date();
  const queryStart = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const [goalResult, mealsResult, waterResult] = await Promise.all([
    supabase
      .from("goals")
      .select("start_weight_kg, target_weight_kg, target_date, daily_calorie_target")
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("meal_entries")
      .select(
        "id, food_name_snapshot, food_image_key_snapshot, meal_type, total_calories, total_protein_g, total_carbs_g, total_fat_g, eaten_at",
      )
      .gte("eaten_at", queryStart)
      .order("eaten_at", { ascending: false }),
    supabase
      .from("water_entries")
      .select("id, amount_ml, drank_at")
      .gte("drank_at", queryStart)
      .order("drank_at", { ascending: false }),
  ]);

  const todayKey = getDateKey(now, timeZone);
  const todayMeals = (mealsResult.data ?? []).filter(
    (meal) => getDateKey(new Date(meal.eaten_at), timeZone) === todayKey,
  );
  const todayWaterEntries = (waterResult.data ?? []).filter(
    (entry) => getDateKey(new Date(entry.drank_at), timeZone) === todayKey,
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
  const waterTotalMl = todayWaterEntries.reduce((total, entry) => total + Number(entry.amount_ml), 0);
  const currentHeight = profile?.height_cm == null ? null : Number(profile.height_cm);
  const currentWeight = profile?.weight_kg == null ? null : Number(profile.weight_kg);
  const bmi =
    currentHeight === null || currentWeight === null
      ? null
      : calculateBmi({ heightCm: currentHeight, weightKg: currentWeight });
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
    bmi,
    calorieTarget: activeGoal ? Math.round(Number(activeGoal.daily_calorie_target)) : null,
    recentMeals: todayMeals.slice(0, 5).map((meal) => ({
      id: meal.id,
      name: meal.food_name_snapshot,
      mealType: getMealTypeLabel(meal.meal_type as MealType),
      time: timeFormatter.format(new Date(meal.eaten_at)),
      calories: Math.round(Number(meal.total_calories)),
      protein: Math.round(Number(meal.total_protein_g) * 10) / 10,
      imageKey: meal.food_image_key_snapshot,
    })),
    water: {
      targetMl: DAILY_WATER_TARGET_ML,
      totalMl: waterTotalMl,
      remainingMl: Math.max(0, DAILY_WATER_TARGET_ML - waterTotalMl),
      percentage: calculateWaterProgress(waterTotalMl),
      entries: todayWaterEntries.map((entry) => ({
        id: entry.id,
        amountMl: Number(entry.amount_ml),
        time: timeFormatter.format(new Date(entry.drank_at)),
      })),
    },
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
