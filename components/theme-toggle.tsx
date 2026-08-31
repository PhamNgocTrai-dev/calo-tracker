"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { resolveTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function readTheme(): Theme {
  let savedTheme: string | null = null;

  try {
    savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Fall back to the operating system when storage is unavailable.
  }

  let prefersDark = false;

  try {
    prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    // Keep the light fallback when matchMedia is unavailable.
  }

  return resolveTheme(savedTheme, prefersDark);
}

export function ThemeToggle() {
  useLayoutEffect(() => {
    applyTheme(readTheme());
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
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
