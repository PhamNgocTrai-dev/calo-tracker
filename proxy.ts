import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildLoginPath, isPublicRoute } from "@/lib/auth/routing";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

function copySessionState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  source.headers.forEach((value, name) => {
    if (name.toLowerCase() !== "location" && name.toLowerCase() !== "set-cookie") {
      target.headers.set(name, value);
    }
  });
  target.headers.set("Cache-Control", "private, no-store");
  return target;
}

function redirectToLogin(request: NextRequest, sessionResponse: NextResponse) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL(buildLoginPath(requestedPath), request.url);
  return copySessionState(sessionResponse, NextResponse.redirect(loginUrl));
}

export async function proxy(request: NextRequest) {
  const publicRoute = isPublicRoute(request.nextUrl.pathname);
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return publicRoute ? response : redirectToLogin(request, response);
  }

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && typeof data?.claims?.sub === "string";

  if (!publicRoute && !authenticated) {
    return redirectToLogin(request, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
