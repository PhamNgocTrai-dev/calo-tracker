"use server";

import { revalidatePath } from "next/cache";
import { calculateGoalPlan, goalPlanSchema, type GoalPlan } from "@/lib/domain/calorie";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GoalActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  plan?: GoalPlan;
};

function toNumber(formData: FormData, name: string) {
  return Number(formData.get(name));
}

export async function saveGoalAction(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase chưa được cấu hình." };
  }

  const parsed = goalPlanSchema.safeParse({
    sex: formData.get("sex"),
    age: toNumber(formData, "age"),
    heightCm: toNumber(formData, "heightCm"),
    currentWeightKg: toNumber(formData, "currentWeightKg"),
    targetWeightKg: toNumber(formData, "targetWeightKg"),
    durationWeeks: toNumber(formData, "durationWeeks"),
    activityLevel: formData.get("activityLevel"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Vui lòng kiểm tra lại thông tin cơ thể và mục tiêu.",
    };
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      status: "error",
      message: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
    };
  }

  const plan = calculateGoalPlan(parsed.data);
  const targetDate = new Date();
  targetDate.setUTCDate(targetDate.getUTCDate() + parsed.data.durationWeeks * 7);

  const { error: saveError } = await supabase.rpc("save_goal_plan", {
    p_biological_sex: parsed.data.sex,
    p_height_cm: parsed.data.heightCm,
    p_weight_kg: parsed.data.currentWeightKg,
    p_activity_level: parsed.data.activityLevel,
    p_target_weight_kg: parsed.data.targetWeightKg,
    p_target_date: targetDate.toISOString().slice(0, 10),
    p_estimated_bmr: plan.bmr,
    p_estimated_tdee: plan.tdee,
    p_daily_calorie_target: plan.dailyCalorieTarget,
  });

  if (saveError) {
    return {
      status: "error",
      message: "Không thể lưu mục tiêu. Hãy kiểm tra migration 002 đã được chạy trong Supabase.",
      plan,
    };
  }

  revalidatePath("/calculator");
  revalidatePath("/");
  return {
    status: "success",
    message: "Đã lưu profile và mục tiêu mới vào PostgreSQL.",
    plan,
  };
}
