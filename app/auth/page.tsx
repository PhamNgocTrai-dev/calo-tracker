import { redirect } from "next/navigation";
import { buildAuthPath, normalizeLoginReason } from "@/lib/auth/routing";

export default async function AuthCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  let target = buildAuthPath("/login", params.next, normalizeLoginReason(params.reason));

  if (params.error === "callback") {
    target += `${target.includes("?") ? "&" : "?"}error=callback`;
  }

  redirect(target);
}
