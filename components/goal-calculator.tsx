"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Gauge, HeartPulse, Save, Scale, Sparkles } from "lucide-react";
import { saveGoalAction, type GoalActionState } from "@/app/calculator/actions";
import { activityLevels, calculateGoalPlan, goalPlanSchema, type GoalPlan } from "@/lib/domain/calorie";

const initialGoalActionState: GoalActionState = { status: "idle" };
const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const numberFormatter = new Intl.NumberFormat("vi-VN");

function toNumber(formData: FormData, name: string) {
  return Number(formData.get(name));
}

export function GoalCalculator({ mode = "demo" }: { mode?: "demo" | "unauthenticated" | "authenticated" }) {
  const [localPlan, setLocalPlan] = useState<GoalPlan | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [serverState, formAction, pending] = useActionState(saveGoalAction, initialGoalActionState);
  const plan = mode === "authenticated" ? (serverState.plan ?? null) : localPlan;
  const error =
    mode === "authenticated" ? (serverState.status === "error" ? serverState.message : null) : localError;

  function handleLocalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = goalPlanSchema.safeParse({
      sex: formData.get("sex"),
      age: toNumber(formData, "age"),
      heightCm: toNumber(formData, "heightCm"),
      currentWeightKg: toNumber(formData, "currentWeightKg"),
      targetWeightKg: toNumber(formData, "targetWeightKg"),
      durationWeeks: toNumber(formData, "durationWeeks"),
      activityLevel: formData.get("activityLevel"),
    });

    if (!result.success) {
      setLocalPlan(null);
      setLocalError("Vui lòng kiểm tra lại các trường. Công cụ hiện dành cho người từ 18 tuổi trở lên.");
      return;
    }

    setLocalError(null);
    setLocalPlan(calculateGoalPlan(result.data));
  }

  const formProps = mode === "authenticated" ? { action: formAction } : { onSubmit: handleLocalSubmit };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <form
        {...formProps}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles aria-hidden="true" className="size-3.5" /> Mifflin–St Jeor
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Thông tin cơ thể và mục tiêu
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Nhập dữ liệu hiện tại để ước tính BMR, TDEE và mức calo mỗi ngày.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Giới tính dùng trong công thức
            <select name="sex" defaultValue="male" className={inputClassName}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tuổi
            <input
              name="age"
              type="number"
              min="18"
              max="100"
              defaultValue="30"
              required
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Chiều cao (cm)
            <input
              name="heightCm"
              type="number"
              min="120"
              max="230"
              step="0.1"
              defaultValue="170"
              required
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cân nặng hiện tại (kg)
            <input
              name="currentWeightKg"
              type="number"
              min="35"
              max="300"
              step="0.1"
              defaultValue="72"
              required
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cân nặng mục tiêu (kg)
            <input
              name="targetWeightKg"
              type="number"
              min="35"
              max="300"
              step="0.1"
              defaultValue="66"
              required
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Thời gian mong muốn (tuần)
            <input
              name="durationWeeks"
              type="number"
              min="1"
              max="104"
              defaultValue="14"
              required
              className={inputClassName}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2 dark:text-slate-200">
            Mức độ vận động
            <select name="activityLevel" defaultValue="moderate" className={inputClassName}>
              {activityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} — {level.description}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {error}
          </p>
        ) : null}

        {mode === "authenticated" && serverState.status === "success" ? (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          >
            {serverState.message}
          </p>
        ) : null}

        {mode !== "authenticated" ? (
          <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {mode === "demo"
              ? "Đây là chế độ demo: kết quả chỉ tồn tại trên màn hình và chưa được lưu."
              : "Bạn có thể tính thử, nhưng cần đăng nhập để lưu profile và mục tiêu vào database."}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60"
        >
          {mode === "authenticated" ? (
            <Save aria-hidden="true" className="size-5" />
          ) : (
            <Gauge aria-hidden="true" className="size-5" />
          )}
          {pending
            ? "Đang tính và lưu..."
            : mode === "authenticated"
              ? "Tính và lưu mục tiêu"
              : "Tính kế hoạch của tôi"}
        </button>
      </form>

      <section
        className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8 dark:border-slate-800"
        aria-live="polite"
      >
        {plan ? <PlanResult plan={plan} /> : <EmptyResult />}
      </section>
    </div>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-white/10 text-emerald-300">
        <HeartPulse aria-hidden="true" className="size-8" />
      </span>
      <h2 className="mt-6 text-2xl font-bold">Kế hoạch sẽ hiện ở đây</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
        Điền biểu mẫu để xem nhu cầu năng lượng và tốc độ thay đổi cân nặng phù hợp hơn.
      </p>
    </div>
  );
}

function PlanResult({ plan }: { plan: GoalPlan }) {
  const directionLabel = plan.direction === "lose" ? "giảm" : plan.direction === "gain" ? "tăng" : "duy trì";

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        <CheckCircle2 aria-hidden="true" className="size-3.5" /> Đã tính toán
      </span>
      <p className="mt-5 text-sm text-slate-400">Mục tiêu calo đề xuất</p>
      <div className="mt-1 flex items-baseline gap-2">
        <strong className="text-5xl font-bold tracking-tight">
          {numberFormatter.format(plan.dailyCalorieTarget)}
        </strong>
        <span className="text-sm text-slate-400">kcal/ngày</span>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <ResultMetric label="BMR" value={`${numberFormatter.format(plan.bmr)} kcal`} icon={HeartPulse} />
        <ResultMetric label="TDEE" value={`${numberFormatter.format(plan.tdee)} kcal`} icon={Gauge} />
        <ResultMetric
          label={`Tốc độ ${directionLabel}`}
          value={`${Math.abs(plan.recommendedWeeklyChangeKg)} kg/tuần`}
          icon={Scale}
        />
        <ResultMetric
          label="Thời gian ước tính"
          value={`${plan.estimatedDurationWeeks} tuần`}
          icon={Sparkles}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <p className="text-sm font-semibold">Điều chỉnh mỗi ngày</p>
        <p className="mt-1 text-sm text-slate-300">
          {plan.dailyCalorieAdjustment === 0
            ? "Duy trì gần mức TDEE."
            : `${plan.dailyCalorieAdjustment > 0 ? "+" : ""}${numberFormatter.format(plan.dailyCalorieAdjustment)} kcal so với TDEE.`}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {plan.notices.map((notice) => (
          <p
            key={notice}
            className={`flex gap-2 text-xs leading-5 ${plan.isAggressive ? "text-amber-200" : "text-slate-400"}`}
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> {notice}
          </p>
        ))}
      </div>
    </div>
  );
}

function ResultMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Gauge }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-4">
      <Icon aria-hidden="true" className="size-4 text-emerald-300" />
      <p className="mt-3 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
