import Link from "next/link";
import { ArrowRight, Clock3, UtensilsCrossed } from "lucide-react";
import { DeleteMealButton } from "@/components/delete-meal-button";
import { FoodThumbnail } from "@/components/food-thumbnail";

export type MealListItem = {
  id: string;
  name: string;
  mealType: string;
  time: string;
  calories: number;
  protein: number;
  imageKey: string | null;
};

export function MealList({ meals }: { meals: MealListItem[] }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nhật ký hôm nay</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Bữa ăn gần đây
          </h2>
        </div>
        <Link
          href="/meals"
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Xem tất cả <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {meals.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            <UtensilsCrossed aria-hidden="true" className="size-5" />
          </span>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">Chưa có bữa ăn hôm nay</p>
          <Link href="/meals" className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Ghi bữa ăn đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
          {meals.map((meal) => (
            <li key={meal.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <FoodThumbnail imageKey={meal.imageKey} name={meal.name} decorative />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{meal.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {meal.mealType} <span aria-hidden="true">·</span>{" "}
                  <Clock3 aria-hidden="true" className="size-3" /> {meal.time}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums text-slate-900 dark:text-white">{meal.calories} kcal</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{meal.protein}g protein</p>
              </div>
              <DeleteMealButton mealId={meal.id} mealName={meal.name} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
