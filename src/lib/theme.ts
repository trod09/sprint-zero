/**
 * Light/dark theme. The choice lives in localStorage; without one the app
 * starts dark, its main theme. The `.dark` class on <html> drives the styles.
 */
export const THEME_STORAGE_KEY = "sprint-zero:theme";

export type Theme = "light" | "dark";

/**
 * Runs synchronously in <head>, before first paint, so a returning user never
 * sees a flash of the wrong theme. Keep it in sync with `resolveTheme`.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=t!=="light";var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export function resolveTheme(): Theme {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage blocked: fall through to the system preference.
  }
  return stored === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
}
