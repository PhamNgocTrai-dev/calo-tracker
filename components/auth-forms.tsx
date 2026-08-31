"use client";

import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { signInAction, signUpAction, type AuthActionState } from "@/app/auth/actions";

const initialAuthState: AuthActionState = { status: "idle" };
const inputClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState);

  return (
    <AuthPanel
      title="Đăng nhập"
      description="Mỗi lần đăng nhập mở một phiên cố định 5 phút. Reload, chuyển trang hoặc thao tác không gia hạn thời gian này."
      action={formAction}
      state={state}
      pending={pending}
      nextPath={nextPath}
      submitLabel="Đăng nhập"
      icon={LogIn}
    />
  );
}

export function RegisterForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialAuthState);

  return (
    <AuthPanel
      title="Tạo tài khoản"
      description="Đăng ký miễn phí để lưu bữa ăn và mục tiêu vào PostgreSQL."
      action={formAction}
      state={state}
      pending={pending}
      nextPath={nextPath}
      submitLabel="Đăng ký"
      icon={UserPlus}
      showDisplayName
    />
  );
}

function AuthPanel({
  title,
  description,
  action,
  state,
  pending,
  nextPath,
  submitLabel,
  icon: Icon,
  showDisplayName = false,
}: {
  title: string;
  description: string;
  action: (payload: FormData) => void;
  state: AuthActionState;
  pending: boolean;
  nextPath: string;
  submitLabel: string;
  icon: typeof LogIn;
  showDisplayName?: boolean;
}) {
  return (
    <form
      action={action}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <input type="hidden" name="next" value={nextPath} />
      <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

      <div className="mt-6 space-y-4">
        {showDisplayName ? (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tên hiển thị
            <input
              name="displayName"
              type="text"
              minLength={2}
              maxLength={80}
              required
              className={inputClassName}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
          <input name="email" type="email" required className={inputClassName} autoComplete="email" />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={72}
            required
            className={inputClassName}
            autoComplete={showDisplayName ? "new-password" : "current-password"}
          />
        </label>
      </div>

      {state.message ? (
        <p
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${state.status === "success" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
      >
        <Icon aria-hidden="true" className="size-4" />
        {pending ? "Đang xử lý..." : submitLabel}
      </button>
    </form>
  );
}
