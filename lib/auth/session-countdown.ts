import { ABSOLUTE_SESSION_WARNING_MS } from "./absolute-session";

export function getInitialRemainingMs(expiresAtMs: number, serverNowMs: number) {
  return Math.max(0, expiresAtMs - serverNowMs);
}

export function getRemainingMs(initialRemainingMs: number, elapsedMs: number) {
  return Math.max(0, initialRemainingMs - Math.max(0, elapsedMs));
}

export function isSessionWarning(remainingMs: number) {
  return remainingMs > 0 && remainingMs <= ABSOLUTE_SESSION_WARNING_MS;
}

export function formatSessionTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
