import { describe, expect, it } from "vitest";
import {
  formatSessionTime,
  getInitialRemainingMs,
  getRemainingMs,
  isSessionWarning,
} from "./session-countdown";

describe("session countdown", () => {
  it("derives remaining time from server timestamps", () => {
    expect(getInitialRemainingMs(400_000, 100_000)).toBe(300_000);
    expect(getInitialRemainingMs(100_000, 100_001)).toBe(0);
  });

  it("uses elapsed monotonic time and clamps at zero", () => {
    expect(getRemainingMs(300_000, 1_250)).toBe(298_750);
    expect(getRemainingMs(1_000, 2_000)).toBe(0);
    expect(getRemainingMs(1_000, -100)).toBe(1_000);
  });

  it("warns only during the final minute", () => {
    expect(isSessionWarning(60_001)).toBe(false);
    expect(isSessionWarning(60_000)).toBe(true);
    expect(isSessionWarning(1)).toBe(true);
    expect(isSessionWarning(0)).toBe(false);
  });

  it("formats a stable mm:ss value", () => {
    expect(formatSessionTime(300_000)).toBe("05:00");
    expect(formatSessionTime(60_000)).toBe("01:00");
    expect(formatSessionTime(59_001)).toBe("01:00");
    expect(formatSessionTime(59_000)).toBe("00:59");
    expect(formatSessionTime(0)).toBe("00:00");
  });
});
