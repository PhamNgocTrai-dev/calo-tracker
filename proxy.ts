import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ABSOLUTE_SESSION_COOKIE_NAME,
  verifyAbsoluteSessionToken,
  type AbsoluteSessionPayload,
} from "@/lib/auth/absolute-session";
import {
  getAbsoluteSessionSigningSecret,
  isAbsoluteSessionConfigured,
} from "@/lib/auth/absolute-session-config";
import { buildLoginPath, isPublicRoute, type LoginReason } from "@/lib/auth/routing";
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

function redirectToLogin(
  request: NextRequest,
  sessionResponse: NextResponse,
  reason: LoginReason = "required",
) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL(buildLoginPath(requestedPath, reason), request.url);
  const redirectResponse = copySessionState(sessionResponse, NextResponse.redirect(loginUrl));
  redirectResponse.cookies.set(ABSOLUTE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return redirectResponse;
}

function verifyRequestDeadline(request: NextRequest) {
  try {
    return verifyAbsoluteSessionToken({
      token: request.cookies.get(ABSOLUTE_SESSION_COOKIE_NAME)?.value,
      nowMs: Date.now(),
      secret: getAbsoluteSessionSigningSecret(),
    });
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const publicRoute = isPublicRoute(request.nextUrl.pathname);
  let response = NextResponse.next({ request });
  let absoluteSession: AbsoluteSessionPayload | null = null;

  if (!isSupabaseConfigured() || !isAbsoluteSessionConfigured()) {
    return publicRoute ? response : redirectToLogin(request, response);
  }

  if (!publicRoute) {
    const verification = verifyRequestDeadline(request);

    if (!verification || !verification.ok) {
      return redirectToLogin(request, response, verification?.reason === "expired" ? "expired" : "required");
    }

    absoluteSession = verification.session;
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
  const userId = !error && typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (!publicRoute) {
    const finalVerification = verifyRequestDeadline(request);

    if (!finalVerification || !finalVerification.ok) {
      return redirectToLogin(
        request,
        response,
        finalVerification?.reason === "expired" ? "expired" : "required",
      );
    }

    if (!userId || absoluteSession?.uid !== userId || finalVerification.session.uid !== userId) {
      return redirectToLogin(request, response);
    }
  }

  if (!publicRoute) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
