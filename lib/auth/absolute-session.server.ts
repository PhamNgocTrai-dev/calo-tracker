import "server-only";

import { cookies } from "next/headers";
import {
  ABSOLUTE_SESSION_COOKIE_NAME,
  ABSOLUTE_SESSION_DURATION_MS,
  createAbsoluteSessionToken,
  verifyAbsoluteSessionToken,
} from "./absolute-session";
import { getAbsoluteSessionSigningSecret } from "./absolute-session-config";

function cookieOptions(expiresAtMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ABSOLUTE_SESSION_DURATION_MS / 1_000,
    expires: new Date(expiresAtMs),
  };
}

export async function issueAbsoluteSession(userId: string) {
  const nowMs = Date.now();
  const result = createAbsoluteSessionToken({
    userId,
    nowMs,
    secret: getAbsoluteSessionSigningSecret(),
  });
  const cookieStore = await cookies();

  cookieStore.set(ABSOLUTE_SESSION_COOKIE_NAME, result.token, cookieOptions(result.session.exp));

  return {
    issuedAtMs: result.session.iat,
    expiresAtMs: result.session.exp,
  };
}

export async function verifyAbsoluteSessionCookie(nowMs = Date.now()) {
  const cookieStore = await cookies();
  return verifyAbsoluteSessionToken({
    token: cookieStore.get(ABSOLUTE_SESSION_COOKIE_NAME)?.value,
    nowMs,
    secret: getAbsoluteSessionSigningSecret(),
  });
}

export async function clearAbsoluteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ABSOLUTE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
