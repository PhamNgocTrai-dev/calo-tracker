import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { buildLoginPath } from "@/lib/auth/routing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type AuthState =
  | { mode: "unauthenticated"; reason: "not-configured" | "no-session" }
  | { mode: "authenticated"; user: AuthenticatedUser };

export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!isSupabaseConfigured()) {
    return { mode: "unauthenticated", reason: "not-configured" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { mode: "unauthenticated", reason: "no-session" };
  }

  return {
    mode: "authenticated",
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      displayName:
        typeof data.user.user_metadata?.display_name === "string"
          ? data.user.user_metadata.display_name
          : null,
    },
  };
});

export async function requireAuthenticatedUser(nextPath = "/"): Promise<AuthenticatedUser> {
  const authState = await getAuthState();

  if (authState.mode !== "authenticated") {
    redirect(buildLoginPath(nextPath));
  }

  return authState.user;
}
