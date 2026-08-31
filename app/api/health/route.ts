import { isAbsoluteSessionConfigured } from "@/lib/auth/absolute-session-config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function GET() {
  return Response.json({
    status: "ok",
    service: "calo-tracker",
    database: isSupabaseConfigured() ? "configured" : "unconfigured",
    absoluteSession: isAbsoluteSessionConfigured() ? "configured" : "unconfigured",
  });
}
