import { AppHeader } from "@/components/app-header";
import { MealEntryForm, type SavedMealItem } from "@/components/meal-entry-form";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getFoodCatalog } from "@/lib/data/foods";
import { getMealTypeLabel, type MealType } from "@/lib/domain/meals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Nhật ký bữa ăn | CaloFlow",
  description: "Nhập món ăn thủ công và tính dinh dưỡng theo khẩu phần.",
};

export default async function MealsPage() {
  await requireAuthenticatedUser("/meals");

  const supabase = await createSupabaseServerClient();
  const [foods, mealsResult] = await Promise.all([
    getFoodCatalog(),
    supabase
      .from("meal_entries")
      .select(
        "id, food_name_snapshot, food_image_key_snapshot, meal_type, amount_g, total_calories, eaten_at",
      )
      .order("eaten_at", { ascending: false })
      .limit(20),
  ]);

  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const recentMeals: SavedMealItem[] = (mealsResult.data ?? []).map((meal) => ({
    id: meal.id,
    foodName: meal.food_name_snapshot,
    mealType: getMealTypeLabel(meal.meal_type as MealType),
    grams: Number(meal.amount_g),
    calories: Math.round(Number(meal.total_calories)),
    time: timeFormatter.format(new Date(meal.eaten_at)),
    imageKey: meal.food_image_key_snapshot,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Nhật ký dinh dưỡng</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Ghi lại bữa ăn
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            MVP ưu tiên nhập thủ công. Server tự đọc dữ liệu dinh dưỡng đáng tin cậy trước khi lưu, không tin
            số liệu gửi từ trình duyệt.
          </p>
        </div>
        <MealEntryForm foods={foods} recentMeals={recentMeals} />
      </main>
    </div>
  );
}
