export const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function resolveTimeZone(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export function getDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: resolveTimeZone(timeZone),
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
