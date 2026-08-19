import { describe, expect, it } from "vitest";
import { buildAuthPath, buildLoginPath, isPublicRoute, normalizeNextPath } from "./routing";

describe("auth routing", () => {
  it("only exposes the authentication and health routes", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/register")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
    expect(isPublicRoute("/")).toBe(false);
    expect(isPublicRoute("/meals")).toBe(false);
    expect(isPublicRoute("/api/private")).toBe(false);
  });

  it("keeps safe local destinations", () => {
    expect(normalizeNextPath("/meals?day=today#entry")).toBe("/meals?day=today#entry");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/login", "/register", "/auth"])(
    "rejects unsafe or looping destination %s",
    (value) => {
      expect(normalizeNextPath(value)).toBe("/");
    },
  );

  it("builds encoded authentication links", () => {
    expect(buildLoginPath("/meals?day=today")).toBe("/login?next=%2Fmeals%3Fday%3Dtoday");
    expect(buildAuthPath("/register", "/calculator")).toBe("/register?next=%2Fcalculator");
    expect(buildLoginPath("/")).toBe("/login");
  });
});
