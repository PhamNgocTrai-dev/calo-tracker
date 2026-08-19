export function MacroProgress({
  label,
  current,
  target,
  unit,
  color,
}: {
  label: string;
  current: number;
  target: number | null;
  unit: string;
  color: "emerald" | "blue" | "amber";
}) {
  const percentage = target ? Math.min((current / target) * 100, 100) : 0;
  const barColor = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  }[color];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {target === null ? `${current} ${unit} · chưa đặt mục tiêu` : `${current}/${target} ${unit}`}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role={target === null ? undefined : "progressbar"}
        aria-label={
          target === null ? `${label}: ${current} ${unit}` : `${label}: ${current} trên ${target} ${unit}`
        }
        aria-valuemin={target === null ? undefined : 0}
        aria-valuemax={target ?? undefined}
        aria-valuenow={target === null ? undefined : current}
      >
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${target === null ? (current > 0 ? 100 : 0) : percentage}%` }}
        />
      </div>
    </div>
  );
}
