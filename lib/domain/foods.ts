import { z } from "zod";

export const FOOD_SEARCH_LIMIT = 100;

export const foodKinds = [
  { value: "dish", label: "Món ăn" },
  { value: "ingredient", label: "Nguyên liệu" },
  { value: "seasoning", label: "Gia vị" },
  { value: "drink", label: "Đồ uống" },
] as const;

export const foodCategories = [
  { value: "rice-dishes", label: "Món cơm" },
  { value: "noodles", label: "Mì và bún" },
  { value: "soups", label: "Canh và cháo" },
  { value: "bread", label: "Bánh mì và bánh" },
  { value: "protein", label: "Đạm" },
  { value: "staples", label: "Tinh bột" },
  { value: "vegetables", label: "Rau củ" },
  { value: "fruit", label: "Trái cây" },
  { value: "dairy", label: "Sữa" },
  { value: "drinks", label: "Đồ uống" },
  { value: "seasonings", label: "Gia vị và sốt" },
  { value: "other", label: "Khác" },
] as const;

export type FoodKind = (typeof foodKinds)[number]["value"];
export type FoodCategory = (typeof foodCategories)[number]["value"];

export const foodImageKeySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+$/, "Mã ảnh món ăn không hợp lệ.");

export const foodSearchSchema = z.object({
  query: z.string().trim().max(80, "Từ khóa tìm kiếm quá dài.").default(""),
  kind: z.enum(["dish", "ingredient", "seasoning", "drink"]).nullable().default(null),
  category: z
    .enum([
      "rice-dishes",
      "noodles",
      "soups",
      "bread",
      "protein",
      "staples",
      "vegetables",
      "fruit",
      "dairy",
      "drinks",
      "seasonings",
      "other",
    ])
    .nullable()
    .default(null),
});

export type FoodSearchInput = z.infer<typeof foodSearchSchema>;

export type FoodCatalogItem = {
  id: string;
  name: string;
  servingSizeG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  kind: FoodKind;
  category: FoodCategory;
  imageKey: string | null;
};

export function normalizeFoodSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function getFoodKindLabel(kind: FoodKind) {
  return foodKinds.find((item) => item.value === kind)?.label ?? "Thực phẩm";
}

export function getFoodCategoryLabel(category: FoodCategory) {
  return foodCategories.find((item) => item.value === category)?.label ?? "Khác";
}
