import { z } from "zod";

export const KCAL_PER_KILOGRAM = 7_700;

export const activityLevels = [
  { value: "sedentary", label: "Ít vận động", description: "Công việc bàn giấy, ít tập luyện", factor: 1.2 },
  { value: "light", label: "Vận động nhẹ", description: "Tập 1–3 buổi mỗi tuần", factor: 1.375 },
  { value: "moderate", label: "Vận động vừa", description: "Tập 3–5 buổi mỗi tuần", factor: 1.55 },
  { value: "active", label: "Vận động nhiều", description: "Tập 6–7 buổi mỗi tuần", factor: 1.725 },
  {
    value: "very_active",
    label: "Vận động rất nhiều",
    description: "Lao động nặng hoặc tập cường độ cao",
    factor: 1.9,
  },
] as const;

export type ActivityLevel = (typeof activityLevels)[number]["value"];
export type BiologicalSex = "male" | "female";

export const bmiCategories = [
  {
    key: "underweight",
    label: "Thiếu cân",
    range: "Dưới 18.5",
    description: "BMI thấp hơn khoảng tham chiếu phổ biến cho người trưởng thành.",
  },
  {
    key: "healthy",
    label: "Bình thường",
    range: "18.5–24.9",
    description: "BMI nằm trong khoảng tham chiếu phổ biến cho người trưởng thành.",
  },
  {
    key: "overweight",
    label: "Thừa cân",
    range: "25.0–29.9",
    description: "BMI cao hơn khoảng tham chiếu phổ biến cho người trưởng thành.",
  },
  {
    key: "obesity",
    label: "Béo phì",
    range: "Từ 30.0",
    description: "BMI nằm trong nhóm cần được đánh giá sức khỏe kỹ hơn.",
  },
] as const;

export type BmiCategory = (typeof bmiCategories)[number];
export type BmiCategoryKey = BmiCategory["key"];
export type BmiResult = {
  value: number;
  category: BmiCategoryKey;
  label: string;
  range: string;
  description: string;
};

export const goalPlanSchema = z.object({
  sex: z.enum(["male", "female"]),
  age: z.number().int().min(18).max(100),
  heightCm: z.number().min(120).max(230),
  currentWeightKg: z.number().min(35).max(300),
  targetWeightKg: z.number().min(35).max(300),
  durationWeeks: z.number().int().min(1).max(104),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export type GoalPlanInput = z.infer<typeof goalPlanSchema>;

export type GoalPlan = {
  bmi: BmiResult;
  bmr: number;
  tdee: number;
  dailyCalorieAdjustment: number;
  dailyCalorieTarget: number;
  requestedWeeklyChangeKg: number;
  recommendedWeeklyChangeKg: number;
  estimatedDurationWeeks: number;
  isAggressive: boolean;
  direction: "lose" | "gain" | "maintain";
  notices: string[];
};

const round = (value: number, digits = 0) => {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
};

export function getActivityFactor(level: ActivityLevel) {
  return activityLevels.find((item) => item.value === level)?.factor ?? 1.2;
}

export function calculateBmr(input: Pick<GoalPlanInput, "sex" | "age" | "heightCm" | "currentWeightKg">) {
  const base = 10 * input.currentWeightKg + 6.25 * input.heightCm - 5 * input.age;
  return round(base + (input.sex === "male" ? 5 : -161), 1);
}

export function calculateBmi({
  heightCm,
  weightKg,
}: {
  heightCm: number;
  weightKg: number;
}): BmiResult | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const value = round(weightKg / heightM ** 2, 1);
  const category =
    value < 18.5
      ? bmiCategories[0]
      : value < 25
        ? bmiCategories[1]
        : value < 30
          ? bmiCategories[2]
          : bmiCategories[3];

  return {
    value,
    category: category.key,
    label: category.label,
    range: category.range,
    description: category.description,
  };
}

export function calculateGoalPlan(rawInput: GoalPlanInput): GoalPlan {
  const input = goalPlanSchema.parse(rawInput);
  const bmi = calculateBmi({ heightCm: input.heightCm, weightKg: input.currentWeightKg });
  const bmr = calculateBmr(input);

  if (!bmi) {
    throw new Error("Không thể tính BMI từ chiều cao và cân nặng đã nhập.");
  }
  const tdee = round(bmr * getActivityFactor(input.activityLevel), 0);
  const weightDeltaKg = input.targetWeightKg - input.currentWeightKg;
  const direction = weightDeltaKg < 0 ? "lose" : weightDeltaKg > 0 ? "gain" : "maintain";

  if (direction === "maintain") {
    return {
      bmi,
      bmr,
      tdee,
      dailyCalorieAdjustment: 0,
      dailyCalorieTarget: tdee,
      requestedWeeklyChangeKg: 0,
      recommendedWeeklyChangeKg: 0,
      estimatedDurationWeeks: 0,
      isAggressive: false,
      direction,
      notices: ["Cân nặng mục tiêu đã bằng cân nặng hiện tại. Hãy duy trì mức calo gần TDEE."],
    };
  }

  const requestedDailyAdjustment = (weightDeltaKg * KCAL_PER_KILOGRAM) / (input.durationWeeks * 7);
  const safetyLimitedAdjustment = Math.min(500, Math.max(-1_000, requestedDailyAdjustment));
  const calorieTargetBeforeFloor = tdee + safetyLimitedAdjustment;
  const dailyCalorieTarget = Math.max(bmr, calorieTargetBeforeFloor);
  const dailyCalorieAdjustment = dailyCalorieTarget - tdee;
  const requestedWeeklyChangeKg = (requestedDailyAdjustment * 7) / KCAL_PER_KILOGRAM;
  const recommendedWeeklyChangeKg = (dailyCalorieAdjustment * 7) / KCAL_PER_KILOGRAM;
  const isAggressive = Math.abs(requestedDailyAdjustment - dailyCalorieAdjustment) > 1;
  const estimatedDurationWeeks = Math.abs(weightDeltaKg / recommendedWeeklyChangeKg);
  const notices: string[] = [];

  if (isAggressive) {
    notices.push(
      "Thời gian bạn chọn yêu cầu thay đổi quá nhanh. Kế hoạch đã được điều chỉnh về mức thận trọng hơn.",
    );
  }

  if (dailyCalorieTarget === bmr && calorieTargetBeforeFloor < bmr) {
    notices.push("Mức calo mục tiêu được giữ không thấp hơn BMR ước tính của bạn.");
  }

  notices.push(
    "Kết quả chỉ mang tính tham khảo cho người trưởng thành khỏe mạnh, không thay thế tư vấn y tế hoặc dinh dưỡng.",
  );

  return {
    bmi,
    bmr,
    tdee,
    dailyCalorieAdjustment: round(dailyCalorieAdjustment, 0),
    dailyCalorieTarget: round(dailyCalorieTarget, 0),
    requestedWeeklyChangeKg: round(requestedWeeklyChangeKg, 2),
    recommendedWeeklyChangeKg: round(recommendedWeeklyChangeKg, 2),
    estimatedDurationWeeks: round(estimatedDurationWeeks, 1),
    isAggressive,
    direction,
    notices,
  };
}
