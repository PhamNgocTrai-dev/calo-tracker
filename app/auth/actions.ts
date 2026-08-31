"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAbsoluteSessionCookie, issueAbsoluteSession } from "@/lib/auth/absolute-session.server";
import { isAbsoluteSessionConfigured } from "@/lib/auth/absolute-session-config";
import { getSignUpErrorMessage } from "@/lib/auth/errors";
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
  if (!isAbsoluteSessionConfigured()) {
    return { status: "error", message: "Chính sách phiên đăng nhập phía server chưa được cấu hình." };
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { status: "error", message: "Email hoặc mật khẩu không đúng, hoặc email chưa được xác nhận." };
  }

  try {
    await issueAbsoluteSession(data.user.id);
  } catch {
    await supabase.auth.signOut().catch(() => undefined);
    await clearAbsoluteSessionCookie();
    return { status: "error", message: "Không thể khởi tạo phiên đăng nhập 5 phút. Vui lòng thử lại." };
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
  if (!isAbsoluteSessionConfigured()) {
    return { status: "error", message: "Chính sách phiên đăng nhập phía server chưa được cấu hình." };
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
  let signUpResult;

  try {
    signUpResult = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: callbackUrl,
      },
    });
  } catch {
    return { status: "error", message: getSignUpErrorMessage({}) };
  }

  const { data, error } = signUpResult;

  if (error) {
    return { status: "error", message: getSignUpErrorMessage(error) };
  }

  if (!data.session) {
    return {
      status: "success",
      message: "Tài khoản đã được tạo. Hãy mở email xác nhận trong cùng trình duyệt này.",
    };
  }

  if (!data.user) {
    await supabase.auth.signOut().catch(() => undefined);
    return { status: "error", message: "Không thể xác định tài khoản vừa đăng ký." };
  }

  try {
    await issueAbsoluteSession(data.user.id);
  } catch {
    await supabase.auth.signOut().catch(() => undefined);
    await clearAbsoluteSessionCookie();
    return { status: "error", message: "Không thể khởi tạo phiên đăng nhập 5 phút. Vui lòng thử lại." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOutAction() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient({ writableCookies: true });
      await supabase.auth.signOut();
    }
  } finally {
    await clearAbsoluteSessionCookie();
    revalidatePath("/", "layout");
  }

  redirect("/login?reason=signed-out");
}
