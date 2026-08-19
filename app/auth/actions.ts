"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeNextPath } from "@/lib/auth/routing";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(72),
  displayName: z.string().trim().min(2).max(80).optional(),
  next: z.string().optional(),
});

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase chưa được cấu hình." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: "Email hoặc mật khẩu không đúng, hoặc email chưa được xác nhận." };
  }

  revalidatePath("/", "layout");
  redirect(normalizeNextPath(parsed.data.next));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase chưa được cấu hình." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success || !parsed.data.displayName) {
    return { status: "error", message: parsed.error?.issues[0]?.message ?? "Vui lòng nhập tên hiển thị." };
  }

  const next = normalizeNextPath(parsed.data.next);
  const callbackUrl = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
  const supabase = await createSupabaseServerClient({ writableCookies: true });
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    return { status: "error", message: "Không thể tạo tài khoản. Vui lòng thử lại sau." };
  }

  if (!data.session) {
    return {
      status: "success",
      message: "Tài khoản đã được tạo. Hãy mở email xác nhận trong cùng trình duyệt này.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient({ writableCookies: true });
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }

  redirect("/login");
}
