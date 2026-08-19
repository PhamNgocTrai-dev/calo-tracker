"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();
  browserClient ??= createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}
