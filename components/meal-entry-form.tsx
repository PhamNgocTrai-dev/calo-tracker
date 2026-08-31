"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { addMealAction, type MealActionState } from "@/app/meals/actions";
import { DeleteMealButton } from "@/components/delete-meal-button";
import { FoodPicker } from "@/components/food-picker";
import { FoodThumbnail } from "@/components/food-thumbnail";
import type { FoodCatalogItem } from "@/lib/domain/foods";
import { mealTypes } from "@/lib/domain/meals";

const initialMealActionState: MealActionState = { status: "idle" };

export type SavedMealItem = {
  id: string;
  foodName: string;
  mealType: string;
  grams: number;
  calories: number;
  time: string;
  imageKey: string | null;
};

export function MealEntryForm({
  foods,
  recentMeals,
}: {
  foods: FoodCatalogItem[];
  recentMeals: SavedMealItem[];
}) {
  const [state, formAction, pending] = useActionState(addMealAction, initialMealActionState);
  const [selectedFood, setSelectedFood] = useState<FoodCatalogItem | undefined>(foods[0]);
  const [grams, setGrams] = useState(250);
  const nutrition = useMemo(() => {
    const ratio = Math.max(0, grams) / 100;
    return {
      calories: Math.round((selectedFood?.calories ?? 0) * ratio),
      protein: Math.round((selectedFood?.protein ?? 0) * ratio * 10) / 10,
      carbs: Math.round((selectedFood?.carbs ?? 0) * ratio * 10) / 10,
      fat: Math.round((selectedFood?.fat ?? 0) * ratio * 10) / 10,
    };
  }, [grams, selectedFood]);

  if (foods.length === 0) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <h2 className="font-bold">Chưa có dữ liệu món ăn</h2>
        <p className="mt-2 text-sm leading-6">
          Hãy chạy file seed trong Supabase SQL Editor rồi tải lại trang.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
      <form
        action={formAction}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Dữ liệu dinh dưỡng đã được kiểm tra
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Thêm món ăn
            </h2>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <UtensilsCrossed aria-hidden="true" className="size-5" />
          </span>
        </div>

        <FoodPicker foods={foods} selectedFood={selectedFood} onSelect={setSelectedFood} />

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Khối lượng (g)
            <input
              name="amountG"
              type="number"
              min="1"
              max="5000"
              step="0.1"
              value={grams}
              onChange={(event) => setGrams(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Bữa ăn
            <select
              name="mealType"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
            >
              {mealTypes.map((mealType) => (
                <option key={mealType.value} value={mealType.value}>
                  {mealType.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/60">
          <div className="flex items-center gap-4">
            <FoodThumbnail
              imageKey={selectedFood?.imageKey}
              name={selectedFood?.name ?? "Thực phẩm"}
              className="size-20"
              sizes="80px"
              decorative
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {selectedFood?.name ?? "Chưa chọn thực phẩm"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Năng lượng ước tính trên {grams || 0}g</p>
              <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                {nutrition.calories} <span className="text-sm text-slate-500">kcal</span>
              </p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            <div>
              <dt className="text-xs text-slate-500">Protein</dt>
              <dd className="mt-1 text-sm font-bold">{nutrition.protein}g</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Carb</dt>
              <dd className="mt-1 text-sm font-bold">{nutrition.carbs}g</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Fat</dt>
              <dd className="mt-1 text-sm font-bold">{nutrition.fat}g</dd>
            </div>
          </dl>
        </div>

        {state.message ? (
          <p
            role="status"
            className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
              state.status === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !selectedFood}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          <Plus aria-hidden="true" className="size-5" />
          {pending ? "Đang lưu..." : "Lưu vào nhật ký"}
        </button>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dữ liệu tài khoản</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Bữa ăn gần đây
          </h2>
        </div>

        {recentMeals.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <UtensilsCrossed aria-hidden="true" className="size-6" />
            </span>
            <p className="mt-5 font-semibold text-slate-900 dark:text-white">Chưa có bữa ăn đã lưu</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Bữa ăn mới sẽ xuất hiện ở đây và vẫn còn sau khi tải lại trang.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recentMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <FoodThumbnail imageKey={meal.imageKey} name={meal.foodName} decorative />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{meal.foodName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {meal.mealType} · {meal.grams}g · {meal.time}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums">{meal.calories} kcal</p>
                <DeleteMealButton mealId={meal.id} mealName={meal.foodName} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
