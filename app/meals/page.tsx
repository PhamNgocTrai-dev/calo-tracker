import Link from "next/link";
import { Database, LogIn } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { MealEntryForm, type FoodOption, type SavedMealItem } from "@/components/meal-entry-form";
import { MealEntryDemo } from "@/components/meal-entry-demo";
import { getAuthState } from "@/lib/auth/session";
import { getMealTypeLabel, type MealType } from "@/lib/domain/meals";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Nhật ký bữa ăn | CaloFlow",
  description: "Nhập món ăn thủ công và tính dinh dưỡng theo khẩu phần.",
};

export default async function MealsPage() {
  const authState = await getAuthState();
  let foods: FoodOption[] = [];
  let recentMeals: SavedMealItem[] = [];

  if (authState.mode === "authenticated") {
    const supabase = await createSupabaseServerClient();
    const [foodsResult, mealsResult] = await Promise.all([
      supabase
        .from("food_items")
        .select("id, name, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g")
        .order("name"),
      supabase
        .from("meal_entries")
        .select("id, food_name_snapshot, meal_type, amount_g, total_calories, eaten_at")
        .order("eaten_at", { ascending: false })
        .limit(20),
    ]);

    foods = (foodsResult.data ?? []).map((food) => ({
      id: food.id,
      name: food.name,
      calories: Number(food.calories_per_100g),
      protein: Number(food.protein_g_per_100g),
      carbs: Number(food.carbs_g_per_100g),
      fat: Number(food.fat_g_per_100g),
    }));

    const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });

    recentMeals = (mealsResult.data ?? []).map((meal) => ({
      id: meal.id,
      foodName: meal.food_name_snapshot,
      mealType: getMealTypeLabel(meal.meal_type as MealType),
      grams: Number(meal.amount_g),
      calories: Math.round(Number(meal.total_calories)),
      time: timeFormatter.format(new Date(meal.eaten_at)),
    }));
  }

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

        {authState.mode === "demo" ? (
          <MealEntryDemo />
        ) : authState.mode === "unauthenticated" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="mx-auto grid size-14 place-items-center rounded-3xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Database aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
              Đăng nhập để lưu vào database
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Khi Supabase đã cấu hình, CaloFlow không hiển thị dữ liệu demo như dữ liệu thật. Đăng nhập để
              đọc và ghi nhật ký riêng của bạn.
            </p>
            <Link
              href="/auth?next=/meals"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <LogIn aria-hidden="true" className="size-4" /> Đăng nhập
            </Link>
          </section>
        ) : (
          <MealEntryForm foods={foods} recentMeals={recentMeals} />
        )}
      </main>
    </div>
  );
}
