import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, SessionConfigurationNotice, SupabaseConfigurationNotice } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { buildAuthPath, normalizeLoginReason, normalizeNextPath } from "@/lib/auth/routing";
import { getAuthState } from "@/lib/auth/session";

export const metadata = {
  title: "Đăng nhập | CaloFlow",
  description: "Đăng nhập để truy cập dữ liệu CaloFlow của bạn.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);
  const reason = normalizeLoginReason(params.reason);
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
      {params.error === "callback" || params.error === "session-config" ? (
        <p className="mb-5 rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
          {params.error === "callback"
            ? "Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập hoặc đăng ký lại."
            : "Không thể khởi tạo phiên đăng nhập 5 phút. Hãy kiểm tra cấu hình server."}
        </p>
      ) : null}

      {reason ? (
        <p className="mb-5 rounded-2xl bg-amber-50 p-4 text-center text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {reason === "expired"
            ? "Phiên ứng dụng 5 phút đã kết thúc. Hãy đăng nhập lại để tiếp tục."
            : reason === "signed-out"
              ? "Bạn đã đăng xuất."
              : "Bạn cần đăng nhập để truy cập trang này."}
        </p>
      ) : null}

      {authState.reason === "supabase-not-configured" ? (
        <SupabaseConfigurationNotice />
      ) : authState.reason === "session-not-configured" ? (
        <SessionConfigurationNotice />
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
