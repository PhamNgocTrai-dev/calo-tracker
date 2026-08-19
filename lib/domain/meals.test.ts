import { describe, expect, it } from "vitest";
import { getMealTypeLabel, mealEntrySchema } from "./meals";

const validMeal = {
  foodItemId: "550e8400-e29b-41d4-a716-446655440000",
  amountG: 250,
  mealType: "breakfast",
};

describe("meal entry validation", () => {
  it("accepts a valid database meal value", () => {
    expect(mealEntrySchema.safeParse(validMeal).success).toBe(true);
    expect(getMealTypeLabel("breakfast")).toBe("Bữa sáng");
  });

  it("rejects a localized label as a database value", () => {
    expect(mealEntrySchema.safeParse({ ...validMeal, mealType: "Bữa sáng" }).success).toBe(false);
  });

  it.each([0, -20, 5_001])("rejects an invalid amount: %s", (amountG) => {
    expect(mealEntrySchema.safeParse({ ...validMeal, amountG }).success).toBe(false);
  });
});
