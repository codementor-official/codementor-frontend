"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemePreference = "light" | "dark" | "system";

const OPTIONS = [
  ["light", "Sáng", Sun],
  ["dark", "Tối", Moon],
  ["system", "Theo hệ thống", Monitor],
] as const;

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = preference;
}

/**
 * Light/dark/system picker for the console topbars.
 *
 * `storageKey` stays per application: each one's layout inlines a script that reads its
 * own key before first paint, and sharing one key here without changing those scripts
 * would just make the flash-of-wrong-theme come back.
 */
export function ThemeMenu({ storageKey }: { storageKey: string }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const select = (preference: ThemePreference) => {
    setTheme(preference);
    localStorage.setItem(storageKey, preference);
    applyTheme(preference);
    setOpen(false);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Chọn giao diện"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => {
          // Read on open, not on mount: localStorage is not available during the server
          // render, and setting state from an effect just to catch up costs a second pass.
          setTheme((localStorage.getItem(storageKey) as ThemePreference | null) ?? "system");
          setOpen((value) => !value);
        }}
        type="button"
      >
        <ThemeIcon aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <div
          className="absolute top-11 right-0 w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          role="menu"
        >
          {OPTIONS.map(([value, label, Icon]) => (
            <button
              className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm ${
                theme === value ? "bg-muted" : "hover:bg-muted"
              }`}
              key={value}
              onClick={() => select(value)}
              role="menuitem"
              type="button"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
