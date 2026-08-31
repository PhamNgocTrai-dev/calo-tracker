import { NextResponse, type NextRequest } from "next/server";
import { clearAbsoluteSessionCookie } from "@/lib/auth/absolute-session.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse(null, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  await clearAbsoluteSessionCookie();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient({ writableCookies: true });
      await supabase.auth.signOut();
    } catch {
      // The signed application deadline remains authoritative even if Supabase cleanup fails.
    }
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
