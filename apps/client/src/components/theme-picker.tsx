"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyTheme,
  useThemeStore,
  type ThemePreference,
} from "@/lib/store/theme-store";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Sáng", icon: Sun },
  { value: "dark", label: "Tối", icon: Moon },
  { value: "system", label: "Hệ thống", icon: Monitor },
];

/** Segmented light/dark/system control, sized to sit inside the user menu. */
export function ThemePicker() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const [mounted, setMounted] = useState(false);

  // The server has no idea which theme is stored, so rendering the selected state
  // before hydration would mismatch. Until then every option renders unselected.
  useEffect(() => setMounted(true), []);

  // Following the OS means tracking it, not just reading it once.
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system", true);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div className="px-3 py-2">
      <div className="mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
        Giao diện
      </div>
      <div
        role="radiogroup"
        aria-label="Giao diện"
        className="flex gap-1 rounded-md border border-border p-0.5"
      >
        {OPTIONS.map((option) => {
          const active = mounted && preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.label}
              onClick={() => setPreference(option.value)}
              className={`flex h-7 flex-1 items-center justify-center gap-1 rounded-sm text-2xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "bg-navy text-on-ink"
                  : "text-text-muted hover:bg-bg hover:text-navy"
              }`}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
