import { describe, expect, it } from "vitest";
import { calculateBmr, calculateGoalPlan, getActivityFactor, goalPlanSchema } from "./calorie";

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
