import { z } from "zod";

export const DAILY_WATER_TARGET_ML = 2_000;
export const WATER_MIN_AMOUNT_ML = 50;
export const WATER_MAX_AMOUNT_ML = 2_000;
export const WATER_PRESETS_ML = [250, 350, 500] as const;

export const addWaterEntrySchema = z.object({
  amountMl: z.coerce
    .number("Lượng nước phải là một số ml hợp lệ.")
    .int("Lượng nước phải là số ml nguyên.")
    .min(WATER_MIN_AMOUNT_ML, `Mỗi lần uống cần ít nhất ${WATER_MIN_AMOUNT_ML} ml.`)
    .max(
      WATER_MAX_AMOUNT_ML,
      `Mỗi lần nhập không được vượt quá ${WATER_MAX_AMOUNT_ML.toLocaleString("vi-VN")} ml.`,
    ),
});

export const deleteWaterEntrySchema = z.object({
  waterEntryId: z.uuid("Lần uống nước không hợp lệ."),
});

export function calculateWaterProgress(totalMl: number, targetMl = DAILY_WATER_TARGET_ML) {
  if (!Number.isFinite(totalMl) || !Number.isFinite(targetMl) || targetMl <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((totalMl / targetMl) * 100)));
}
