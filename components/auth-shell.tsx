import Link from "next/link";
import type { ReactNode } from "react";
import { Salad } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/login" className="flex items-center gap-3" aria-label="CaloFlow">
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
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}

export function SupabaseConfigurationNotice() {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/50">
      <h2 className="font-bold text-amber-950 dark:text-amber-100">Supabase chưa được cấu hình</h2>
      <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
        Hãy thêm các biến môi trường trong <span className="font-mono">.env.local</span> rồi khởi động lại
        server trên port 3000.
      </p>
    </section>
  );
}
