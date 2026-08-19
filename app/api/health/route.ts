import { isSupabaseConfigured } from "@/lib/supabase/config";

export function GET() {
  return Response.json({
    status: "ok",
    service: "calo-tracker",
    database: isSupabaseConfigured() ? "configured" : "demo-mode",
  });
}
