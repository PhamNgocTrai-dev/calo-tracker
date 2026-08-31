import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_ZONE, getDateKey, resolveTimeZone } from "./dates";

describe("resolveTimeZone", () => {
  it("keeps a valid IANA timezone", () => {
    expect(resolveTimeZone("America/Los_Angeles")).toBe("America/Los_Angeles");
  });

  it.each([null, undefined, "", "Invalid/Timezone"])("falls back for %s", (value) => {
    expect(resolveTimeZone(value)).toBe(DEFAULT_TIME_ZONE);
  });
});

describe("getDateKey", () => {
  it("maps the same instant to the correct local calendar day", () => {
    const instant = new Date("2026-08-22T18:30:00.000Z");

    expect(getDateKey(instant, "Asia/Ho_Chi_Minh")).toBe("2026-08-23");
    expect(getDateKey(instant, "America/Los_Angeles")).toBe("2026-08-22");
  });

  it("handles a daylight-saving transition without using server local time", () => {
    expect(getDateKey(new Date("2026-03-08T09:30:00.000Z"), "America/Los_Angeles")).toBe("2026-03-08");
  });

  it("uses the fallback when the timezone is invalid", () => {
    const instant = new Date("2026-08-22T18:30:00.000Z");
    expect(getDateKey(instant, "Invalid/Timezone")).toBe("2026-08-23");
  });
});
