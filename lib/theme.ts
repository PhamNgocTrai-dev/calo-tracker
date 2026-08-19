export const THEME_STORAGE_KEY = "caloflow-theme";

export type Theme = "light" | "dark";

export function resolveTheme(savedTheme: string | null, prefersDark: boolean): Theme {
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export const themeInitializationScript = `
(function () {
  var saved = null;
  try { saved = window.localStorage.getItem("${THEME_STORAGE_KEY}"); } catch (error) {}
  var prefersDark = false;
  try { prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (error) {}
  var theme = saved === "light" || saved === "dark" ? saved : (prefersDark ? "dark" : "light");
  var root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
})();
`;
