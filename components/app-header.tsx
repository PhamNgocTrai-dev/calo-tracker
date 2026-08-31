import Link from "next/link";
import { Calculator, LayoutDashboard, LogOut, Salad } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { SessionCountdown } from "@/components/session-countdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAuthenticatedSession } from "@/lib/auth/session";

const navigation = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/meals", label: "Bữa ăn", icon: Salad },
  { href: "/calculator", label: "Tính mục tiêu", icon: Calculator },
];

export async function AppHeader() {
  const session = await requireAuthenticatedSession();
  const { user } = session;

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="CaloFlow - Trang tổng quan">
          <span className="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
            <Salad aria-hidden="true" className="size-5" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-950 dark:text-white">
              CaloFlow
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Ăn tốt · Sống khỏe</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex dark:border-slate-800 dark:bg-slate-900"
          aria-label="Điều hướng chính"
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <SessionCountdown
            key={`${session.expiresAtMs}-${session.serverNowMs}`}
            expiresAtMs={session.expiresAtMs}
            serverNowMs={session.serverNowMs}
          />
          <ThemeToggle />
          <span className="hidden min-w-0 text-right sm:block">
            <span className="block max-w-40 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {user.displayName ?? "Tài khoản của bạn"}
            </span>
            <span className="block max-w-40 truncate text-xs text-slate-500 dark:text-slate-400">
              {user.email ?? "Đã đăng nhập"}
            </span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut aria-hidden="true" className="size-4.5" />
            </button>
          </form>
        </div>
      </div>

      <nav
        className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:hidden"
        aria-label="Điều hướng trên thiết bị di động"
      >
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
