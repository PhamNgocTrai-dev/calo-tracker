import Link from "next/link";
import { Flame, Footprints } from "lucide-react";

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

export function DailyEnergyCard({
  target,
  consumed,
  burned,
}: {
  target: number | null;
  consumed: number;
  burned: number | null;
}) {
  const remaining = target === null ? null : Math.max(target - consumed, 0);
  const percentage = target === null || target === 0 ? 0 : Math.min((consumed / target) * 100, 100);

  return (
    <article className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-7 dark:border dark:border-slate-800">
      <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            <Flame aria-hidden="true" className="size-3.5" />
            Năng lượng hôm nay
          </span>
          <p className="mt-5 text-sm text-slate-400">
            {target === null ? "Đã nạp hôm nay" : "Còn lại trong mục tiêu"}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <strong className="text-5xl font-bold tracking-tight">
              {formatNumber(remaining ?? consumed)}
            </strong>
            <span className="text-sm font-medium text-slate-400">kcal</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-64">
          <div className="rounded-2xl bg-white/[0.07] p-4">
            <p className="text-xs text-slate-400">Đã nạp</p>
            <p className="mt-1 text-lg font-bold">{formatNumber(consumed)}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Footprints aria-hidden="true" className="size-3.5" /> Đã vận động
            </p>
            <p className="mt-1 text-lg font-bold">{burned === null ? "Chưa có" : formatNumber(burned)}</p>
          </div>
        </div>
      </div>

      {target === null ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
          Chưa có mục tiêu calo đang hoạt động.{" "}
          <Link href="/calculator" className="font-bold text-emerald-300 hover:text-emerald-200">
            Tính và lưu mục tiêu
          </Link>
        </p>
      ) : (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>{Math.round(percentage)}% mục tiêu</span>
            <span>{formatNumber(target)} kcal</span>
          </div>
          <progress
            className="energy-progress h-3 w-full overflow-hidden rounded-full"
            max={target}
            value={Math.min(consumed, target)}
            aria-label={`${Math.round(percentage)} phần trăm mục tiêu calo đã sử dụng`}
          />
        </div>
      )}
    </article>
  );
}
