"use client";

import { useActionState, useEffect, useRef } from "react";
import { Droplets, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { addWaterEntryAction, deleteWaterEntryAction, type WaterActionState } from "@/app/water/actions";
import { WATER_MAX_AMOUNT_ML, WATER_MIN_AMOUNT_ML, WATER_PRESETS_ML } from "@/lib/domain/water";

const initialWaterActionState: WaterActionState = { status: "idle" };

type WaterEntry = {
  id: string;
  amountMl: number;
  time: string;
};

type WaterTrackerCardProps = {
  targetMl: number;
  totalMl: number;
  remainingMl: number;
  percentage: number;
  entries: WaterEntry[];
};

export function WaterTrackerCard({
  targetMl,
  totalMl,
  remainingMl,
  percentage,
  entries,
}: WaterTrackerCardProps) {
  const [quickState, quickFormAction, quickPending] = useActionState(
    addWaterEntryAction,
    initialWaterActionState,
  );
  const [customState, customFormAction, customPending] = useActionState(
    addWaterEntryAction,
    initialWaterActionState,
  );
  const customFormRef = useRef<HTMLFormElement>(null);
  const reachedTarget = totalMl >= targetMl;

  useEffect(() => {
    if (customState.status === "success") {
      customFormRef.current?.reset();
    }
  }, [customState]);

  return (
    <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)]">
        <section className="p-6 sm:p-8" aria-labelledby="water-tracker-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Nước hôm nay</p>
              <h2
                id="water-tracker-title"
                className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
              >
                Theo dõi lượng nước
              </h2>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Droplets aria-hidden="true" className="size-5" />
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
            <p className="text-4xl font-bold tracking-tight text-slate-950 tabular-nums dark:text-white">
              {totalMl.toLocaleString("vi-VN")} <span className="text-base text-slate-500">ml</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mục tiêu {targetMl.toLocaleString("vi-VN")} ml
            </p>
          </div>

          <div
            role="progressbar"
            aria-label={`Đã uống ${totalMl} trên mục tiêu ${targetMl} ml`}
            aria-valuemin={0}
            aria-valuemax={targetMl}
            aria-valuenow={Math.min(totalMl, targetMl)}
            className="mt-5 h-3 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-300 dark:bg-blue-400"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {reachedTarget
              ? "Bạn đã đạt mục tiêu nước hôm nay."
              : `Còn ${remainingMl.toLocaleString("vi-VN")} ml`}
          </p>

          <form action={quickFormAction} className="mt-7">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Thêm nhanh</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {WATER_PRESETS_ML.map((amountMl) => (
                <button
                  key={amountMl}
                  type="submit"
                  name="amountMl"
                  value={amountMl}
                  disabled={quickPending}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-bold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                >
                  {quickPending ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Plus aria-hidden="true" className="size-4" />
                  )}
                  {amountMl} ml
                </button>
              ))}
            </div>
            <WaterActionMessage state={quickState} />
          </form>

          <form
            ref={customFormRef}
            action={customFormAction}
            className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800"
          >
            <label
              htmlFor="custom-water-amount"
              className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Nhập lượng nước khác
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Nhập từ {WATER_MIN_AMOUNT_ML} đến {WATER_MAX_AMOUNT_ML.toLocaleString("vi-VN")} ml cho mỗi lần
              uống.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  id="custom-water-amount"
                  name="amountMl"
                  type="number"
                  min={WATER_MIN_AMOUNT_ML}
                  max={WATER_MAX_AMOUNT_ML}
                  step="1"
                  inputMode="numeric"
                  required
                  placeholder="Ví dụ: 750"
                  disabled={customPending}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500">
                  ml
                </span>
              </div>
              <button
                type="submit"
                disabled={customPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60"
              >
                {customPending ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Plus aria-hidden="true" className="size-4" />
                )}
                Thêm nước
              </button>
            </div>
            <WaterActionMessage state={customState} />
          </form>
        </section>

        <section className="border-t border-slate-200 bg-slate-50/70 p-6 sm:p-8 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-950/40">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chi tiết hôm nay</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Các lần đã uống</h3>
          </div>

          {entries.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
              <Droplets aria-hidden="true" className="mx-auto size-7 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Chưa ghi nhận nước uống
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Chọn mức nhanh hoặc nhập lượng nước để bắt đầu.
              </p>
            </div>
          ) : (
            <ul className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Droplets aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      {entry.amountMl} ml
                    </span>
                    <span className="block text-xs text-slate-500">Lúc {entry.time}</span>
                  </span>
                  <DeleteWaterEntryButton entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}

function WaterActionMessage({ state }: { state: WaterActionState }) {
  if (!state.message) return null;

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`mt-3 text-sm font-medium ${
        state.status === "error" ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
      }`}
    >
      {state.message}
    </p>
  );
}

function DeleteWaterEntryButton({ entry }: { entry: WaterEntry }) {
  const [state, formAction, pending] = useActionState(deleteWaterEntryAction, initialWaterActionState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa lần uống ${entry.amountMl} ml lúc ${entry.time}?`)) {
          event.preventDefault();
        }
      }}
      className="flex shrink-0 flex-col items-end gap-1"
    >
      <input type="hidden" name="waterEntryId" value={entry.id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Xóa lần uống ${entry.amountMl} ml lúc ${entry.time}`}
        title="Xóa lần uống nước"
        className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-red-950 dark:hover:text-red-300"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" className="size-4" />
        )}
      </button>
      {state.status === "error" && state.message ? (
        <span role="alert" className="max-w-40 text-right text-xs leading-4 text-red-600 dark:text-red-300">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
