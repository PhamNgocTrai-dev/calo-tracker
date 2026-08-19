const PUBLIC_ROUTES = new Set(["/login", "/register", "/auth", "/auth/callback", "/api/health"]);
const AUTH_ENTRY_ROUTES = new Set(["/login", "/register", "/auth"]);
const LOCAL_ORIGIN = "https://caloflow.local";

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

export function buildAuthPath(route: "/login" | "/register", nextPath?: string) {
  const next = normalizeNextPath(nextPath);

  if (next === "/") {
    return route;
  }

  const params = new URLSearchParams({ next });
  return `${route}?${params.toString()}`;
}

export function buildLoginPath(nextPath?: string) {
  return buildAuthPath("/login", nextPath);
}
