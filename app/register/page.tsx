import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, SupabaseConfigurationNotice } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";
import { buildAuthPath, normalizeNextPath } from "@/lib/auth/routing";
import { getAuthState } from "@/lib/auth/session";

export const metadata = {
  title: "Đăng ký | CaloFlow",
  description: "Tạo tài khoản CaloFlow để lưu dữ liệu vào PostgreSQL.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);
  const authState = await getAuthState();

  if (authState.mode === "authenticated") {
    redirect(nextPath);
  }

  return (
    <AuthShell
      eyebrow="Bắt đầu với CaloFlow"
      title="Tạo tài khoản mới"
      description="Đăng ký riêng biệt để lưu nhật ký và mục tiêu của bạn an toàn trên Supabase."
    >
      {authState.reason === "not-configured" ? (
        <SupabaseConfigurationNotice />
      ) : (
        <>
          <RegisterForm nextPath={nextPath} />
          <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Supabase sẽ gửi email xác nhận. Nếu email không gửi được, hãy cấu hình Custom SMTP hoặc tạm tắt
            Confirm email trong môi trường phát triển.
          </p>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        Đã có tài khoản?{" "}
        <Link
          href={buildAuthPath("/login", nextPath)}
          className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
