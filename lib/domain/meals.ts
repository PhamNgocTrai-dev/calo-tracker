import { z } from "zod";

export const mealTypes = [
  { value: "breakfast", label: "Bữa sáng" },
  { value: "lunch", label: "Bữa trưa" },
  { value: "dinner", label: "Bữa tối" },
  { value: "snack", label: "Bữa phụ" },
] as const;

export type MealType = (typeof mealTypes)[number]["value"];

export const mealEntrySchema = z.object({
  foodItemId: z.uuid("Món ăn không hợp lệ."),
  amountG: z.number().positive("Khối lượng phải lớn hơn 0.").max(5_000, "Khối lượng tối đa là 5.000g."),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export type MealEntryInput = z.infer<typeof mealEntrySchema>;

export function getMealTypeLabel(type: MealType) {
  return mealTypes.find((item) => item.value === type)?.label ?? "Bữa ăn";
}
