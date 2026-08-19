import { NextResponse, type NextRequest } from "next/server";
import { normalizeNextPath } from "@/lib/auth/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function callbackErrorUrl(request: NextRequest) {
  return new URL("/login?error=callback", request.url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"));

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(callbackErrorUrl(request));
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(callbackErrorUrl(request));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
