import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const THEME_STORAGE_KEY = "codementor-theme";

/** Resolves "system" against the OS setting; the other two answer for themselves. */
export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

let transitionTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Flips the `.dark` class, optionally cross-fading the colour change.
 *
 * The `.theme-transition` class is deliberately temporary: the rule behind it targets `*`,
 * so leaving it on would add a 220ms lag to every hover state in the app.
 *
 * `animate` is off for the calls that run on load/rehydrate — there is no previous colour
 * to fade from there, and animating would just delay first paint.
 */
export function applyTheme(preference: ThemePreference, animate = false) {
  const root = document.documentElement;

  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-transition");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => root.classList.remove("theme-transition"), 260);
  }

  root.classList.toggle("dark", resolveTheme(preference) === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        applyTheme(preference, true);
        set({ preference });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      // Persisted state arrives after hydration, so the class has to be re-applied then —
      // the inline script in <head> only knows what was in localStorage at page load.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.preference);
      },
    },
  ),
);
