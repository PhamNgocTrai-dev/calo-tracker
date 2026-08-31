import "server-only";

import { ABSOLUTE_SESSION_MIN_SECRET_BYTES } from "./absolute-session";

export function isAbsoluteSessionConfigured() {
  const secret = process.env.AUTH_SESSION_SIGNING_SECRET;
  return typeof secret === "string" && Buffer.byteLength(secret, "utf8") >= ABSOLUTE_SESSION_MIN_SECRET_BYTES;
}

export function getAbsoluteSessionSigningSecret() {
  const secret = process.env.AUTH_SESSION_SIGNING_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < ABSOLUTE_SESSION_MIN_SECRET_BYTES) {
    throw new Error("AUTH_SESSION_SIGNING_SECRET must contain at least 32 UTF-8 bytes.");
  }

  return secret;
}
