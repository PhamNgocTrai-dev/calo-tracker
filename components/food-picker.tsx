"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { FoodThumbnail } from "@/components/food-thumbnail";
import {
  foodCategories,
  foodKinds,
  getFoodCategoryLabel,
  normalizeFoodSearch,
  type FoodCatalogItem,
  type FoodCategory,
  type FoodKind,
} from "@/lib/domain/foods";

type FoodPickerProps = {
  foods: FoodCatalogItem[];
  selectedFood: FoodCatalogItem | undefined;
  onSelect: (food: FoodCatalogItem) => void;
};

export function FoodPicker({ foods = [], selectedFood, onSelect }: FoodPickerProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<FoodKind | null>(null);
  const [category, setCategory] = useState<FoodCategory | null>(null);
  const filteredFoods = useMemo(() => {
    const normalizedQuery = normalizeFoodSearch(query);

    return foods.filter((food) => {
      if (kind && food.kind !== kind) return false;
      if (category && food.category !== category) return false;
      return !normalizedQuery || normalizeFoodSearch(food.name).includes(normalizedQuery);
    });
  }, [category, foods, kind, query]);

  return (
    <div className="mt-7">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        Tìm món ăn hoặc nguyên liệu
        <span className="relative mt-2 block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví dụ: phở, ức gà, cà chua, nước mắm..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950"
          />
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Lọc theo loại thực phẩm">
        <FilterChip active={kind === null} onClick={() => setKind(null)}>
          Tất cả
        </FilterChip>
        {foodKinds.map((item) => (
          <FilterChip
            key={item.value}
            active={kind === item.value}
            onClick={() => {
              setKind(item.value);
              setCategory(null);
            }}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" aria-label="Lọc theo nhóm thực phẩm">
        <FilterChip active={category === null} onClick={() => setCategory(null)} compact>
          Mọi nhóm
        </FilterChip>
        {foodCategories
          .filter((item) => item.value !== "other")
          .map((item) => (
            <FilterChip
              key={item.value}
              active={category === item.value}
              onClick={() => setCategory(item.value)}
              compact
            >
              {item.label}
            </FilterChip>
          ))}
      </div>

      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {filteredFoods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
            Không tìm thấy món phù hợp. Hãy thử từ khóa hoặc nhóm khác.
          </div>
        ) : (
          filteredFoods.map((food) => {
            const active = selectedFood?.id === food.id;
            return (
              <label
                key={food.id}
                className={`relative flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-left transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600 ${
                  active
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50"
                    : "border-slate-100 hover:border-emerald-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-emerald-900 dark:hover:bg-slate-950"
                }`}
              >
                <input
                  type="radio"
                  name="foodItemId"
                  value={food.id}
                  checked={active}
                  onChange={() => onSelect(food)}
                  className="sr-only"
                />
                <FoodThumbnail imageKey={food.imageKey} name={food.name} decorative />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                    {food.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {getFoodCategoryLabel(food.category)} · {Math.round(food.calories)} kcal/100g
                  </span>
                </span>
                {active ? (
                  <span className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white">
                    <Check aria-hidden="true" className="size-4" />
                  </span>
                ) : null}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border font-semibold transition ${compact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"} ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
