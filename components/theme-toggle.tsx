"use client";

import { Moon, Sun } from "lucide-react";

const THEME_KEY = "caloflow-theme";

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const willBeDark = !root.classList.contains("dark");

    root.classList.toggle("dark", willBeDark);
    root.style.colorScheme = willBeDark ? "dark" : "light";

    try {
      window.localStorage.setItem(THEME_KEY, willBeDark ? "dark" : "light");
    } catch {
      // The visual toggle still works when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Chuyển giao diện sáng hoặc tối"
      title="Đổi giao diện sáng/tối"
      className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Moon aria-hidden="true" className="size-4.5 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4.5 dark:block" />
    </button>
  );
}
