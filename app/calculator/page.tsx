import { AppHeader } from "@/components/app-header";
import { GoalCalculator } from "@/components/goal-calculator";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export const metadata = {
  title: "Tính mục tiêu calo | CaloFlow",
  description: "Ước tính BMR, TDEE và mục tiêu calo mỗi ngày.",
};

export default async function CalculatorPage() {
  await requireAuthenticatedUser("/calculator");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Công cụ mục tiêu</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Tính nhu cầu calo của bạn
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Công thức Mifflin–St Jeor ước tính năng lượng cơ bản, sau đó điều chỉnh theo vận động và thời gian
            mục tiêu. Kết quả chỉ mang tính tham khảo, không thay thế tư vấn y tế.
          </p>
        </div>
        <GoalCalculator />
      </main>
    </div>
  );
}
