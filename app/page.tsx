import Link from "next/link";
import { ArrowRight, Droplets, Flame, Plus, Scale, Sparkles, Target, UtensilsCrossed } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DailyEnergyCard } from "@/components/daily-energy-card";
import { GoalProgressCard } from "@/components/goal-progress-card";
import { MacroProgress } from "@/components/macro-progress";
import { MealList, type MealListItem } from "@/components/meal-list";
import { StatCard } from "@/components/stat-card";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getLiveDashboardData } from "@/lib/data/dashboard";

export default async function Home() {
  await requireAuthenticatedUser("/");
  const data = await getLiveDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <Dashboard
        dateLabel={data.dateLabel}
        caloriesConsumed={data.caloriesConsumed}
        calorieTarget={data.calorieTarget}
        protein={{ current: data.proteinG, target: null, unit: "g" }}
        carbs={{ current: data.carbsG, target: null, unit: "g" }}
        fat={{ current: data.fatG, target: null, unit: "g" }}
        mealCount={data.mealCount}
        currentWeight={data.currentWeight}
        meals={data.recentMeals}
        goal={data.goal}
      />
    </div>
  );
}

type MacroValue = { current: number; target: number | null; unit: string };
type GoalValue = {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  targetDate: string;
};

function Dashboard({
  dateLabel,
  caloriesConsumed,
  calorieTarget,
  protein,
  carbs,
  fat,
  mealCount,
  currentWeight,
  meals,
  goal,
}: {
  dateLabel: string;
  caloriesConsumed: number;
  calorieTarget: number | null;
  protein: MacroValue;
  carbs: MacroValue;
  fat: MacroValue;
  mealCount: number;
  currentWeight: number | null;
  meals: MealListItem[];
  goal: GoalValue | null;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold capitalize text-emerald-700 dark:text-emerald-400">
            {dateLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
            Tổng quan dinh dưỡng 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Theo dõi từng lựa chọn nhỏ để tiến gần hơn tới mục tiêu sức khỏe của bạn.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            <Sparkles aria-hidden="true" className="size-4 text-violet-500" /> Tính mục tiêu
          </Link>
          <Link
            href="/meals"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus aria-hidden="true" className="size-4" /> Ghi bữa ăn
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số nhanh">
        <StatCard
          label="Calo đã nạp"
          value={`${caloriesConsumed.toLocaleString("vi-VN")} kcal`}
          helper="Từ nhật ký hôm nay"
          icon={Flame}
          tone="emerald"
        />
        <StatCard
          label="Cân nặng"
          value={currentWeight === null ? "Chưa có" : `${currentWeight} kg`}
          helper={goal ? `Mục tiêu ${goal.targetWeight} kg` : "Lưu mục tiêu để theo dõi"}
          icon={Scale}
          tone="violet"
        />
        <StatCard
          label="Nước uống"
          value="Chưa hỗ trợ"
          helper="Sẽ bổ sung ở phiên bản sau"
          icon={Droplets}
          tone="blue"
        />
        <StatCard
          label="Bữa ăn hôm nay"
          value={`${mealCount} bữa`}
          helper="Đã lưu trong PostgreSQL"
          icon={UtensilsCrossed}
          tone="amber"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <DailyEnergyCard target={calorieTarget} consumed={caloriesConsumed} burned={null} />
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dinh dưỡng</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Macro hôm nay
              </h2>
            </div>
            <Link
              href="/meals"
              aria-label="Xem chi tiết bữa ăn"
              className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="mt-6 space-y-5">
            <MacroProgress label="Protein" {...protein} color="emerald" />
            <MacroProgress label="Carbohydrate" {...carbs} color="blue" />
            <MacroProgress label="Chất béo" {...fat} color="amber" />
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <MealList meals={meals} />
        {goal ? <GoalProgressCard {...goal} /> : <EmptyGoalCard />}
      </section>
    </main>
  );
}

function EmptyGoalCard() {
  return (
    <article className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        <Target aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 font-bold text-slate-950 dark:text-white">Chưa có mục tiêu đang hoạt động</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
        Tính BMR, TDEE và lưu mục tiêu để theo dõi tiến độ ở đây.
      </p>
      <Link href="/calculator" className="mt-4 text-sm font-bold text-violet-700 dark:text-violet-300">
        Tạo mục tiêu
      </Link>
    </article>
  );
}
