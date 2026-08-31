import { describe, expect, it } from "vitest";
import { escapeLikePattern, foodImageKeySchema, foodSearchSchema, normalizeFoodSearch } from "./foods";

describe("food catalog domain", () => {
  it("normalizes Vietnamese search terms", () => {
    expect(normalizeFoodSearch("  Bún bò Huế  ")).toBe("bun bo hue");
    expect(normalizeFoodSearch("Đậu   hũ")).toBe("dau hu");
  });

  it("escapes SQL LIKE wildcard characters", () => {
    expect(escapeLikePattern("100%_safe")).toBe("100\\%\\_safe");
  });

  it("validates supported filters", () => {
    expect(foodSearchSchema.safeParse({ query: "phở", kind: "dish", category: "noodles" }).success).toBe(
      true,
    );
    expect(foodSearchSchema.safeParse({ query: "phở", kind: "unknown" }).success).toBe(false);
  });

  it("accepts only versioned image keys", () => {
    expect(foodImageKeySchema.safeParse("pho-bo-v1").success).toBe(true);
    expect(foodImageKeySchema.safeParse("../pho-bo.webp").success).toBe(false);
  });
});
