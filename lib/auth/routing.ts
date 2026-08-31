const PUBLIC_ROUTES = new Set([
  "/login",
  "/register",
  "/auth",
  "/auth/callback",
  "/auth/logout",
  "/api/health",
]);
const AUTH_ENTRY_ROUTES = new Set(["/login", "/register", "/auth"]);
const LOGIN_REASONS = new Set(["required", "expired", "signed-out"]);
const LOCAL_ORIGIN = "https://caloflow.local";

export type LoginReason = "required" | "expired" | "signed-out";

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export function normalizeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(value, LOCAL_ORIGIN);

    if (url.origin !== LOCAL_ORIGIN || AUTH_ENTRY_ROUTES.has(url.pathname)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function normalizeLoginReason(value: string | null | undefined): LoginReason | undefined {
  return value && LOGIN_REASONS.has(value) ? (value as LoginReason) : undefined;
}

export function buildAuthPath(route: "/login" | "/register", nextPath?: string, reason?: LoginReason) {
  const next = normalizeNextPath(nextPath);
  const params = new URLSearchParams();

  if (next !== "/") {
    params.set("next", next);
  }
  if (route === "/login" && reason) {
    params.set("reason", reason);
  }

  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export function buildLoginPath(nextPath?: string, reason?: LoginReason) {
  return buildAuthPath("/login", nextPath, reason);
}
