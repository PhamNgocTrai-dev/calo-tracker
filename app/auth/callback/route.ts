import { NextResponse, type NextRequest } from "next/server";
import { clearAbsoluteSessionCookie, issueAbsoluteSession } from "@/lib/auth/absolute-session.server";
import { isAbsoluteSessionConfigured } from "@/lib/auth/absolute-session-config";
import { normalizeNextPath } from "@/lib/auth/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function callbackErrorUrl(request: NextRequest) {
  return new URL("/login?error=callback", request.url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured() || !isAbsoluteSessionConfigured() || !code) {
    return NextResponse.redirect(callbackErrorUrl(request));
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(callbackErrorUrl(request));
  }

  try {
    await issueAbsoluteSession(data.user.id);
  } catch {
    await supabase.auth.signOut().catch(() => undefined);
    await clearAbsoluteSessionCookie();
    return NextResponse.redirect(new URL("/login?error=session-config", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
