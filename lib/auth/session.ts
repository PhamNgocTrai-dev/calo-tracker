import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isAbsoluteSessionConfigured } from "@/lib/auth/absolute-session-config";
import { verifyAbsoluteSessionCookie } from "@/lib/auth/absolute-session.server";
import { buildLoginPath } from "@/lib/auth/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type AuthenticatedSession = {
  user: AuthenticatedUser;
  expiresAtMs: number;
  serverNowMs: number;
};

export type AuthFailureReason = "supabase-not-configured" | "session-not-configured" | "required" | "expired";

export type AuthState =
  { mode: "unauthenticated"; reason: AuthFailureReason } | ({ mode: "authenticated" } & AuthenticatedSession);

function toAuthenticatedUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null,
  };
}

function verificationFailureReason(reason: string): AuthFailureReason {
  return reason === "expired" ? "expired" : "required";
}

async function getVerifiedAbsoluteSession() {
  try {
    return await verifyAbsoluteSessionCookie();
  } catch {
    return null;
  }
}

export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!isSupabaseConfigured()) {
    return { mode: "unauthenticated", reason: "supabase-not-configured" };
  }
  if (!isAbsoluteSessionConfigured()) {
    return { mode: "unauthenticated", reason: "session-not-configured" };
  }

  const firstVerification = await getVerifiedAbsoluteSession();
  if (!firstVerification) {
    return { mode: "unauthenticated", reason: "session-not-configured" };
  }
  if (!firstVerification.ok) {
    return {
      mode: "unauthenticated",
      reason: verificationFailureReason(firstVerification.reason),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const serverNowMs = Date.now();
  const finalVerification = await verifyAbsoluteSessionCookie(serverNowMs);

  if (error || !data.user || !finalVerification.ok || finalVerification.session.uid !== data.user.id) {
    return {
      mode: "unauthenticated",
      reason: finalVerification.ok ? "required" : verificationFailureReason(finalVerification.reason),
    };
  }

  return {
    mode: "authenticated",
    user: toAuthenticatedUser(data.user),
    expiresAtMs: finalVerification.session.exp,
    serverNowMs,
  };
});

export async function getAuthenticatedMutationContext() {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: "supabase-not-configured" as const };
  }
  if (!isAbsoluteSessionConfigured()) {
    return { ok: false as const, reason: "session-not-configured" as const };
  }

  const firstVerification = await getVerifiedAbsoluteSession();
  if (!firstVerification) {
    return { ok: false as const, reason: "session-not-configured" as const };
  }
  if (!firstVerification.ok) {
    return {
      ok: false as const,
      reason: verificationFailureReason(firstVerification.reason),
    };
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data, error } = await supabase.auth.getUser();
  const finalVerification = await verifyAbsoluteSessionCookie(Date.now());

  if (error || !data.user || !finalVerification.ok || finalVerification.session.uid !== data.user.id) {
    return {
      ok: false as const,
      reason: finalVerification.ok
        ? ("required" as const)
        : verificationFailureReason(finalVerification.reason),
    };
  }

  return {
    ok: true as const,
    supabase,
    user: toAuthenticatedUser(data.user),
    expiresAtMs: finalVerification.session.exp,
  };
}

export function getAuthFailureMessage(reason: AuthFailureReason) {
  if (reason === "expired") {
    return "Phiên ứng dụng 5 phút đã hết hạn. Hãy đăng nhập lại.";
  }
  if (reason === "supabase-not-configured") {
    return "Supabase chưa được cấu hình.";
  }
  if (reason === "session-not-configured") {
    return "Chính sách phiên đăng nhập 5 phút phía server chưa được cấu hình.";
  }
  return "Bạn cần đăng nhập lại để tiếp tục.";
}

export async function requireAuthenticatedSession(nextPath = "/"): Promise<AuthenticatedSession> {
  const authState = await getAuthState();

  if (authState.mode !== "authenticated") {
    redirect(buildLoginPath(nextPath, authState.reason === "expired" ? "expired" : "required"));
  }

  return authState;
}

export async function requireAuthenticatedUser(nextPath = "/"): Promise<AuthenticatedUser> {
  const session = await requireAuthenticatedSession(nextPath);
  return session.user;
}
