import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ABSOLUTE_SESSION_DURATION_MS,
  createAbsoluteSessionToken,
  verifyAbsoluteSessionToken,
} from "./absolute-session";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const secret = "test-secret-with-at-least-thirty-two-bytes";
const nowMs = 1_800_000_000_000;

function createToken() {
  return createAbsoluteSessionToken({ userId, nowMs, secret }).token;
}

function signPayload(payload: object) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`v1.${encodedPayload}`).digest("base64url");
  return `v1.${encodedPayload}.${signature}`;
}

describe("absolute session", () => {
  it("accepts a signed session before its deadline", () => {
    const result = verifyAbsoluteSessionToken({
      token: createToken(),
      nowMs: nowMs + ABSOLUTE_SESSION_DURATION_MS - 1,
      secret,
    });

    expect(result).toEqual({
      ok: true,
      session: {
        v: 1,
        uid: userId,
        iat: nowMs,
        exp: nowMs + ABSOLUTE_SESSION_DURATION_MS,
      },
    });
  });

  it("expires at the exact five-minute boundary", () => {
    expect(
      verifyAbsoluteSessionToken({
        token: createToken(),
        nowMs: nowMs + ABSOLUTE_SESSION_DURATION_MS,
        secret,
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects missing and malformed tokens", () => {
    expect(verifyAbsoluteSessionToken({ token: undefined, nowMs, secret })).toEqual({
      ok: false,
      reason: "missing",
    });
    expect(verifyAbsoluteSessionToken({ token: "not-a-token", nowMs, secret })).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects payload and signature tampering", () => {
    const [version, payload, signature] = createToken().split(".");
    const changedPayload = `${payload.slice(0, -1)}${payload.endsWith("A") ? "B" : "A"}`;
    const changedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

    expect(
      verifyAbsoluteSessionToken({
        token: `${version}.${changedPayload}.${signature}`,
        nowMs,
        secret,
      }),
    ).toEqual({ ok: false, reason: "invalid-signature" });
    expect(
      verifyAbsoluteSessionToken({
        token: `${version}.${payload}.${changedSignature}`,
        nowMs,
        secret,
      }),
    ).toEqual({ ok: false, reason: "invalid-signature" });
  });

  it("rejects a token signed with another secret", () => {
    expect(
      verifyAbsoluteSessionToken({
        token: createToken(),
        nowMs,
        secret: "another-secret-with-at-least-thirty-two-bytes",
      }),
    ).toEqual({ ok: false, reason: "invalid-signature" });
  });

  it("rejects a correctly signed payload with a different duration", () => {
    const token = signPayload({
      v: 1,
      uid: userId,
      iat: nowMs,
      exp: nowMs + ABSOLUTE_SESSION_DURATION_MS + 1,
    });

    expect(verifyAbsoluteSessionToken({ token, nowMs, secret })).toEqual({
      ok: false,
      reason: "invalid-payload",
    });
  });

  it("requires a strong signing secret", () => {
    expect(() => createAbsoluteSessionToken({ userId, nowMs, secret: "too-short" })).toThrow();
  });

  it("rejects invalid user identifiers", () => {
    expect(() => createAbsoluteSessionToken({ userId: "not-a-user-id", nowMs, secret })).toThrow();
  });
});
