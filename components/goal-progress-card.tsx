import { ArrowDownRight, CalendarDays, Target } from "lucide-react";

export function GoalProgressCard({
  startWeight,
  currentWeight,
  targetWeight,
  targetDate,
}: {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  targetDate: string;
}) {
  const totalChange = Math.abs(startWeight - targetWeight);
  const achieved = Math.abs(startWeight - currentWeight);
  const percentage = totalChange === 0 ? 100 : Math.min((achieved / totalChange) * 100, 100);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tiến độ cân nặng</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Hướng tới {targetWeight} kg
          </h2>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <Target aria-hidden="true" className="size-5" />
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hiện tại</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {currentWeight} <span className="text-sm font-medium text-slate-500">kg</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ArrowDownRight aria-hidden="true" className="size-3.5" />
            {achieved.toFixed(1)} kg
          </span>
        </div>

        <div
          className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-label={`Đã hoàn thành ${Math.round(percentage)} phần trăm mục tiêu cân nặng`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
        >
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${percentage}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Bắt đầu {startWeight} kg</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <CalendarDays aria-hidden="true" className="size-4 text-slate-400" />
        Ngày mục tiêu: <strong className="font-semibold">{targetDate}</strong>
      </p>
    </article>
  );
}
