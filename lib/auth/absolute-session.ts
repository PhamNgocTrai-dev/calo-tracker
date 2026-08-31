import { createHmac, timingSafeEqual } from "node:crypto";

export const ABSOLUTE_SESSION_DURATION_MS = 5 * 60 * 1_000;
export const ABSOLUTE_SESSION_WARNING_MS = 60 * 1_000;
export const ABSOLUTE_SESSION_COOKIE_NAME = "caloflow_absolute_session";
export const ABSOLUTE_SESSION_VERSION = 1;
export const ABSOLUTE_SESSION_MIN_SECRET_BYTES = 32;

export type AbsoluteSessionPayload = {
  v: typeof ABSOLUTE_SESSION_VERSION;
  uid: string;
  iat: number;
  exp: number;
};

export type AbsoluteSessionFailureReason =
  "missing" | "malformed" | "invalid-signature" | "invalid-payload" | "expired";

export type AbsoluteSessionVerification =
  { ok: true; session: AbsoluteSessionPayload } | { ok: false; reason: AbsoluteSessionFailureReason };

const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(`v${ABSOLUTE_SESSION_VERSION}.${encodedPayload}`).digest();
}

function isValidPayload(value: unknown): value is AbsoluteSessionPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<AbsoluteSessionPayload>;
  return (
    payload.v === ABSOLUTE_SESSION_VERSION &&
    typeof payload.uid === "string" &&
    userIdPattern.test(payload.uid) &&
    Number.isSafeInteger(payload.iat) &&
    Number.isSafeInteger(payload.exp) &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    payload.iat >= 0 &&
    payload.exp - payload.iat === ABSOLUTE_SESSION_DURATION_MS
  );
}

export function assertAbsoluteSessionSecret(secret: string) {
  if (Buffer.byteLength(secret, "utf8") < ABSOLUTE_SESSION_MIN_SECRET_BYTES) {
    throw new Error("Absolute session signing secret is missing or too short.");
  }
}

export function createAbsoluteSessionToken({
  userId,
  nowMs,
  secret,
}: {
  userId: string;
  nowMs: number;
  secret: string;
}) {
  assertAbsoluteSessionSecret(secret);

  const payload: AbsoluteSessionPayload = {
    v: ABSOLUTE_SESSION_VERSION,
    uid: userId,
    iat: nowMs,
    exp: nowMs + ABSOLUTE_SESSION_DURATION_MS,
  };

  if (!isValidPayload(payload)) {
    throw new Error("Cannot create an absolute session for an invalid user or timestamp.");
  }

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = encode(sign(encodedPayload, secret));

  return {
    token: `v${ABSOLUTE_SESSION_VERSION}.${encodedPayload}.${signature}`,
    session: payload,
  };
}

export function verifyAbsoluteSessionToken({
  token,
  nowMs,
  secret,
}: {
  token: string | null | undefined;
  nowMs: number;
  secret: string;
}): AbsoluteSessionVerification {
  assertAbsoluteSessionSecret(secret);

  if (!token) return { ok: false, reason: "missing" };

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== `v${ABSOLUTE_SESSION_VERSION}`) {
    return { ok: false, reason: "malformed" };
  }

  const [, encodedPayload, encodedSignature] = parts;

  try {
    const actualSignature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = sign(encodedPayload, secret);

    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return { ok: false, reason: "invalid-signature" };
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as unknown;
    if (!isValidPayload(payload)) {
      return { ok: false, reason: "invalid-payload" };
    }

    if (nowMs >= payload.exp) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true, session: payload };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}
