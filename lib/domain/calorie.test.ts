import { describe, expect, it } from "vitest";
import { calculateBmi, calculateBmr, calculateGoalPlan, getActivityFactor, goalPlanSchema } from "./calorie";

describe("BMI calculations", () => {
  it("calculates and rounds BMI to one decimal place", () => {
    expect(calculateBmi({ heightCm: 175, weightKg: 70 })).toEqual({
      value: 22.9,
      category: "healthy",
      label: "Bình thường",
      range: "18.5–24.9",
      description: "BMI nằm trong khoảng tham chiếu phổ biến cho người trưởng thành.",
    });
  });

  it.each([
    [18.4, "underweight"],
    [18.5, "healthy"],
    [24.9, "healthy"],
    [25, "overweight"],
    [29.9, "overweight"],
    [30, "obesity"],
  ] as const)("classifies displayed BMI %s as %s", (bmi, category) => {
    expect(calculateBmi({ heightCm: 200, weightKg: bmi * 4 })?.category).toBe(category);
  });

  it.each([
    { heightCm: 0, weightKg: 70 },
    { heightCm: 175, weightKg: 0 },
    { heightCm: Number.NaN, weightKg: 70 },
    { heightCm: 175, weightKg: Number.POSITIVE_INFINITY },
  ])("returns null for invalid measurements", (input) => {
    expect(calculateBmi(input)).toBeNull();
  });
});

describe("calorie calculations", () => {
  it("calculates Mifflin-St Jeor BMR for a male profile", () => {
    expect(calculateBmr({ sex: "male", age: 30, heightCm: 175, currentWeightKg: 70 })).toBe(1_648.8);
  });

  it("calculates Mifflin-St Jeor BMR for a female profile", () => {
    expect(calculateBmr({ sex: "female", age: 28, heightCm: 165, currentWeightKg: 60 })).toBe(1_330.3);
  });

  it("uses the configured activity factor", () => {
    expect(getActivityFactor("moderate")).toBe(1.55);
    expect(getActivityFactor("very_active")).toBe(1.9);
  });

  it("uses the database-compatible activity enum", () => {
    const baseInput = {
      sex: "male" as const,
      age: 30,
      heightCm: 175,
      currentWeightKg: 70,
      targetWeightKg: 65,
      durationWeeks: 12,
    };

    expect(goalPlanSchema.safeParse({ ...baseInput, activityLevel: "very_active" }).success).toBe(true);
    expect(goalPlanSchema.safeParse({ ...baseInput, activityLevel: "very-active" }).success).toBe(false);
  });

  it("creates a sustainable weight-loss plan", () => {
    const plan = calculateGoalPlan({
      sex: "male",
      age: 30,
      heightCm: 175,
      currentWeightKg: 70,
      targetWeightKg: 65,
      durationWeeks: 12,
      activityLevel: "moderate",
    });

    expect(plan.bmi).toMatchObject({ value: 22.9, category: "healthy" });
    expect(plan.tdee).toBe(2_556);
    expect(plan.dailyCalorieTarget).toBe(2_098);
    expect(plan.direction).toBe("lose");
    expect(plan.isAggressive).toBe(false);
  });

  it("limits an aggressive goal and returns a warning", () => {
    const plan = calculateGoalPlan({
      sex: "female",
      age: 25,
      heightCm: 160,
      currentWeightKg: 80,
      targetWeightKg: 60,
      durationWeeks: 4,
      activityLevel: "sedentary",
    });

    expect(plan.isAggressive).toBe(true);
    expect(plan.dailyCalorieTarget).toBeGreaterThanOrEqual(plan.bmr);
    expect(plan.notices[0]).toContain("quá nhanh");
  });
});
