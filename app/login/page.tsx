import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, SupabaseConfigurationNotice } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { buildAuthPath, normalizeNextPath } from "@/lib/auth/routing";
import { getAuthState } from "@/lib/auth/session";

export const metadata = {
  title: "Đăng nhập | CaloFlow",
  description: "Đăng nhập để truy cập dữ liệu CaloFlow của bạn.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);
  const authState = await getAuthState();

  if (authState.mode === "authenticated") {
    redirect(nextPath);
  }

  return (
    <AuthShell
      eyebrow="Tài khoản CaloFlow"
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để xem dashboard, ghi bữa ăn và quản lý mục tiêu cá nhân."
    >
      {params.error === "callback" ? (
        <p className="mb-5 rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
          Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập hoặc đăng ký lại.
        </p>
      ) : null}

      {authState.reason === "not-configured" ? (
        <SupabaseConfigurationNotice />
      ) : (
        <LoginForm nextPath={nextPath} />
      )}

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Chưa có tài khoản?{" "}
        <Link
          href={buildAuthPath("/register", nextPath)}
          className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Đăng ký
        </Link>
      </p>
    </AuthShell>
  );
}
