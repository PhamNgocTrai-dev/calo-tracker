import { describe, expect, it } from "vitest";
import {
  DAILY_WATER_TARGET_ML,
  WATER_MAX_AMOUNT_ML,
  WATER_MIN_AMOUNT_ML,
  addWaterEntrySchema,
  calculateWaterProgress,
  deleteWaterEntrySchema,
} from "./water";

describe("water entry validation", () => {
  it.each([250, 350, 500, "250", "350", "500"])("accepts supported preset %s", (amountMl) => {
    expect(addWaterEntrySchema.safeParse({ amountMl }).success).toBe(true);
  });

  it.each([WATER_MIN_AMOUNT_ML, 125, "750", 1_250, WATER_MAX_AMOUNT_ML])(
    "accepts custom amount %s",
    (amountMl) => {
      expect(addWaterEntrySchema.safeParse({ amountMl }).success).toBe(true);
    },
  );

  it.each([
    undefined,
    "",
    0,
    -250,
    WATER_MIN_AMOUNT_ML - 1,
    WATER_MAX_AMOUNT_ML + 1,
    250.5,
    "water",
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])("rejects invalid amount %s", (amountMl) => {
    expect(addWaterEntrySchema.safeParse({ amountMl }).success).toBe(false);
  });

  it("accepts only UUID entry identifiers", () => {
    expect(
      deleteWaterEntrySchema.safeParse({ waterEntryId: "550e8400-e29b-41d4-a716-446655440000" }).success,
    ).toBe(true);
    expect(deleteWaterEntrySchema.safeParse({ waterEntryId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("water progress", () => {
  it.each([
    [0, 0],
    [1_000, 50],
    [DAILY_WATER_TARGET_ML, 100],
    [2_500, 100],
    [-100, 0],
  ])("maps %i ml to %i percent", (totalMl, expected) => {
    expect(calculateWaterProgress(totalMl)).toBe(expected);
  });

  it("returns zero for an invalid target", () => {
    expect(calculateWaterProgress(500, 0)).toBe(0);
  });
});
