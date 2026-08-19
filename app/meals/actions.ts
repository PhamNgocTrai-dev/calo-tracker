"use server";

import { revalidatePath } from "next/cache";
import { mealEntrySchema } from "@/lib/domain/meals";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MealActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function addMealAction(
  _previousState: MealActionState,
  formData: FormData,
): Promise<MealActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase chưa được cấu hình." };
  }

  const parsed = mealEntrySchema.safeParse({
    foodItemId: formData.get("foodItemId"),
    amountG: Number(formData.get("amountG")),
    mealType: formData.get("mealType"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dữ liệu bữa ăn không hợp lệ.",
    };
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { status: "error", message: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." };
  }

  const { data: food, error: foodError } = await supabase
    .from("food_items")
    .select("id, name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g")
    .eq("id", parsed.data.foodItemId)
    .single();

  if (foodError || !food) {
    return { status: "error", message: "Không tìm thấy món ăn hoặc bạn không có quyền truy cập." };
  }

  const { error: insertError } = await supabase.from("meal_entries").insert({
    user_id: authData.user.id,
    food_item_id: food.id,
    meal_type: parsed.data.mealType,
    food_name_snapshot: food.name,
    amount_g: parsed.data.amountG,
    calories_per_100g: food.calories_per_100g,
    protein_g_per_100g: food.protein_g_per_100g,
    carbs_g_per_100g: food.carbs_g_per_100g,
    fat_g_per_100g: food.fat_g_per_100g,
  });

  if (insertError) {
    return { status: "error", message: "Không thể lưu bữa ăn. Vui lòng thử lại." };
  }

  revalidatePath("/meals");
  revalidatePath("/");
  return { status: "success", message: "Đã lưu bữa ăn vào PostgreSQL." };
}
