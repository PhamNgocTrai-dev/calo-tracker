"use server";

import { revalidatePath } from "next/cache";
import { getFoodCatalog } from "@/lib/data/foods";
import { getAuthenticatedMutationContext, getAuthFailureMessage } from "@/lib/auth/session";
import { foodSearchSchema, type FoodCatalogItem, type FoodSearchInput } from "@/lib/domain/foods";
import { deleteMealSchema, mealEntrySchema } from "@/lib/domain/meals";

export type MealActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function addMealAction(
  _previousState: MealActionState,
  formData: FormData,
): Promise<MealActionState> {
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

  const auth = await getAuthenticatedMutationContext();
  if (!auth.ok) {
    return { status: "error", message: getAuthFailureMessage(auth.reason) };
  }
  const { supabase, user } = auth;

  const { data: food, error: foodError } = await supabase
    .from("food_items")
    .select("id, name, image_key, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g")
    .eq("id", parsed.data.foodItemId)
    .single();

  if (foodError || !food) {
    return { status: "error", message: "Không tìm thấy món ăn hoặc bạn không có quyền truy cập." };
  }

  const { error: insertError } = await supabase.from("meal_entries").insert({
    user_id: user.id,
    food_item_id: food.id,
    meal_type: parsed.data.mealType,
    food_name_snapshot: food.name,
    food_image_key_snapshot: food.image_key,
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

export async function searchFoodsAction(rawInput: Partial<FoodSearchInput>): Promise<FoodCatalogItem[]> {
  const parsed = foodSearchSchema.safeParse(rawInput);
  if (!parsed.success) {
    return [];
  }

  const auth = await getAuthenticatedMutationContext();
  if (!auth.ok) {
    return [];
  }

  try {
    return await getFoodCatalog(parsed.data);
  } catch {
    return [];
  }
}

export async function deleteMealAction(
  _previousState: MealActionState,
  formData: FormData,
): Promise<MealActionState> {
  const parsed = deleteMealSchema.safeParse({
    mealId: formData.get("mealId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Bữa ăn không hợp lệ.",
    };
  }

  const auth = await getAuthenticatedMutationContext();
  if (!auth.ok) {
    return { status: "error", message: getAuthFailureMessage(auth.reason) };
  }
  const { supabase, user } = auth;

  const { data: deletedMeal, error: deleteError } = await supabase
    .from("meal_entries")
    .delete()
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return { status: "error", message: "Không thể xóa bữa ăn. Vui lòng thử lại." };
  }

  if (!deletedMeal) {
    return { status: "error", message: "Không tìm thấy bữa ăn hoặc bạn không có quyền xóa." };
  }

  revalidatePath("/meals");
  revalidatePath("/");
  return { status: "success", message: "Đã xóa bữa ăn khỏi nhật ký." };
}
