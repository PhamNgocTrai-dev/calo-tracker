"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Plus, RotateCcw, Search, UtensilsCrossed } from "lucide-react";

const foods = [
  { id: "pho-bo", name: "Phở bò", calories: 158, protein: 9.1, carbs: 19.2, fat: 5.0 },
  { id: "com-ga", name: "Cơm gà nướng", calories: 186, protein: 12.4, carbs: 20.8, fat: 6.1 },
  { id: "banh-mi-trung", name: "Bánh mì trứng", calories: 265, protein: 10.2, carbs: 32.0, fat: 10.5 },
  { id: "bun-cha", name: "Bún chả", calories: 177, protein: 8.7, carbs: 22.4, fat: 5.8 },
  { id: "uc-ga", name: "Ức gà áp chảo", calories: 165, protein: 31.0, carbs: 0, fat: 3.6 },
] as const;

type LoggedMeal = {
  id: number;
  foodName: string;
  mealType: string;
  grams: number;
  calories: number;
};

export function MealEntryDemo() {
  const [selectedFoodId, setSelectedFoodId] = useState(foods[0].id);
  const [grams, setGrams] = useState(250);
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? foods[0];
  const nutrition = useMemo(() => {
    const ratio = grams / 100;
    return {
      calories: Math.round(selectedFood.calories * ratio),
      protein: Math.round(selectedFood.protein * ratio * 10) / 10,
      carbs: Math.round(selectedFood.carbs * ratio * 10) / 10,
      fat: Math.round(selectedFood.fat * ratio * 10) / 10,
    };
  }, [grams, selectedFood]);

  function addMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoggedMeals((current) => [
      ...current,
      {
        id: Date.now(),
        foodName: selectedFood.name,
        mealType: String(formData.get("mealType")),
        grams,
        calories: nutrition.calories,
      },
    ]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
      <form
        onSubmit={addMeal}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nhập thủ công</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Thêm món ăn
            </h2>
          </div>
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <UtensilsCrossed aria-hidden="true" className="size-5" />
          </span>
        </div>

        <label className="mt-7 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Tìm trong dữ liệu mẫu
          <span className="relative mt-2 block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <select
              value={selectedFoodId}
              onChange={(event) => setSelectedFoodId(event.target.value as typeof selectedFoodId)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
            >
              {foods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name}
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Khối lượng (g)
            <input
              type="number"
              min="1"
              max="3000"
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
              <option>Bữa sáng</option>
              <option>Bữa trưa</option>
              <option>Bữa tối</option>
              <option>Bữa phụ</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/60">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Tổng năng lượng</p>
              <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                {nutrition.calories} <span className="text-sm text-slate-500">kcal</span>
              </p>
            </div>
            <p className="text-xs text-slate-500">trên {grams}g</p>
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

        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
        >
          <Plus aria-hidden="true" className="size-5" /> Thêm vào nhật ký demo
        </button>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Trong phiên hiện tại</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Món vừa thêm
            </h2>
          </div>
          {loggedMeals.length > 0 ? (
            <button
              type="button"
              onClick={() => setLoggedMeals([])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" /> Xóa demo
            </button>
          ) : null}
        </div>

        {loggedMeals.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <UtensilsCrossed aria-hidden="true" className="size-6" />
            </span>
            <p className="mt-5 font-semibold text-slate-900 dark:text-white">Chưa có món mới</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Chọn món, điều chỉnh khẩu phần rồi thêm vào danh sách.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {loggedMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{meal.foodName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {meal.mealType} · {meal.grams}g
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums">{meal.calories} kcal</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Dữ liệu demo chỉ tồn tại trong trình duyệt đến khi tải lại trang. Sau khi cấu hình Supabase và đăng
          nhập, Server Action sẽ lưu nhật ký vào PostgreSQL.
        </p>
      </section>
    </div>
  );
}
