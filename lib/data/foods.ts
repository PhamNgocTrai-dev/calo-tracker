import "server-only";

import {
  FOOD_SEARCH_LIMIT,
  escapeLikePattern,
  foodSearchSchema,
  normalizeFoodSearch,
  type FoodCatalogItem,
  type FoodSearchInput,
} from "@/lib/domain/foods";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const foodCatalogColumns =
  "id, name, serving_size_g, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, food_kind, category_slug, image_key";

export async function getFoodCatalog(rawInput: Partial<FoodSearchInput> = {}): Promise<FoodCatalogItem[]> {
  const input = foodSearchSchema.parse(rawInput);
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("food_items").select(foodCatalogColumns).order("name").limit(FOOD_SEARCH_LIMIT);

  const normalizedQuery = normalizeFoodSearch(input.query);
  if (normalizedQuery) {
    query = query.ilike("normalized_name", `%${escapeLikePattern(normalizedQuery)}%`);
  }
  if (input.kind) {
    query = query.eq("food_kind", input.kind);
  }
  if (input.category) {
    query = query.eq("category_slug", input.category);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Không thể tải danh mục thực phẩm.");
  }

  return (data ?? []).map((food) => ({
    id: food.id,
    name: food.name,
    servingSizeG: Number(food.serving_size_g),
    calories: Number(food.calories_per_100g),
    protein: Number(food.protein_g_per_100g),
    carbs: Number(food.carbs_g_per_100g),
    fat: Number(food.fat_g_per_100g),
    kind: food.food_kind,
    category: food.category_slug,
    imageKey: food.image_key,
  }));
}
