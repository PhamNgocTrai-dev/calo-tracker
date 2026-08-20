"use client";

import { useActionState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteMealAction, type MealActionState } from "@/app/meals/actions";

const initialDeleteState: MealActionState = { status: "idle" };

type DeleteMealButtonProps = {
  mealId: string;
  mealName: string;
};

export function DeleteMealButton({ mealId, mealName }: DeleteMealButtonProps) {
  const [state, formAction, pending] = useActionState(deleteMealAction, initialDeleteState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa “${mealName}” khỏi nhật ký? Hành động này không thể hoàn tác.`)) {
          event.preventDefault();
        }
      }}
      className="flex shrink-0 flex-col items-end gap-1"
    >
      <input type="hidden" name="mealId" value={mealId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`Xóa ${mealName}`}
        title={`Xóa ${mealName}`}
        className="inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-red-950 dark:hover:text-red-300"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" className="size-4" />
        )}
      </button>
      {state.status === "error" && state.message ? (
        <span role="alert" className="max-w-44 text-right text-xs leading-4 text-red-600 dark:text-red-300">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
