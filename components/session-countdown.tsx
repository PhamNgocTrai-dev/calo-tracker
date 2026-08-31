"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock3 } from "lucide-react";
import {
  formatSessionTime,
  getInitialRemainingMs,
  getRemainingMs,
  isSessionWarning,
} from "@/lib/auth/session-countdown";

type SessionCountdownProps = {
  expiresAtMs: number;
  serverNowMs: number;
};

export function SessionCountdown({ expiresAtMs, serverNowMs }: SessionCountdownProps) {
  const router = useRouter();
  const initialRemainingMs = getInitialRemainingMs(expiresAtMs, serverNowMs);
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);
  const logoutStartedRef = useRef(false);
  const warning = isSessionWarning(remainingMs);
  const expired = remainingMs === 0;
  const timeLabel = formatSessionTime(remainingMs);

  useEffect(() => {
    const startingRemainingMs = getInitialRemainingMs(expiresAtMs, serverNowMs);
    const monotonicStart = performance.now();

    const updateRemaining = () => {
      setRemainingMs(getRemainingMs(startingRemainingMs, performance.now() - monotonicStart));
    };
    const interval = window.setInterval(updateRemaining, 250);

    const revalidateSession = () => {
      updateRemaining();
      router.refresh();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateSession();
      }
    };

    window.addEventListener("focus", revalidateSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", revalidateSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expiresAtMs, router, serverNowMs]);

  useEffect(() => {
    if (!expired || logoutStartedRef.current) return;
    logoutStartedRef.current = true;

    void fetch("/auth/logout", { method: "POST", credentials: "same-origin" }).finally(() => {
      window.location.replace("/login?reason=expired");
    });
  }, [expired]);

  return (
    <>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-bold tabular-nums sm:px-3 ${
          warning || expired
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
            : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        }`}
        title="Phiên đăng nhập không tự gia hạn"
      >
        <Clock3 aria-hidden="true" className="size-4" />
        <span className="hidden xl:inline">Phiên còn</span> {timeLabel}
      </span>

      {warning || expired ? (
        <aside
          className={`fixed top-4 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border p-4 shadow-xl ${
            expired
              ? "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          }`}
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">
                {expired ? "Phiên đăng nhập đã hết hạn" : `Phiên sẽ hết hạn sau ${timeLabel}`}
              </p>
              <p className="mt-1 text-sm leading-5 opacity-85">
                {expired
                  ? "Ứng dụng đang đăng xuất và chuyển bạn về trang đăng nhập."
                  : "Hãy hoàn tất thao tác đang làm. Hoạt động trong ứng dụng không gia hạn phiên 5 phút."}
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      <span className="sr-only" aria-live={expired ? "assertive" : "polite"}>
        {expired ? "Phiên đăng nhập đã hết hạn." : warning ? "Phiên đăng nhập còn dưới một phút." : ""}
      </span>
    </>
  );
}
