"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu, Monitor, Moon, PanelLeft, Sun } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

type ThemePreference = "light" | "dark" | "system";

interface LecturerTopbarProps {
  onDesktopToggle: () => void;
  onMobileToggle: () => void;
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = preference;
}

/**
 * Sidebar toggles, theme, sign out. No search box and no notification bell: neither
 * has anything behind it, and a control that never does anything teaches people to
 * ignore the whole bar.
 */
export function LecturerTopbar({ onDesktopToggle, onMobileToggle }: LecturerTopbarProps) {
  const { signOut } = useAuth();
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setThemeOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectTheme = (preference: ThemePreference) => {
    setTheme(preference);
    localStorage.setItem("codementor-lecturer-theme", preference);
    applyTheme(preference);
    setThemeOpen(false);
  };

  const toggleThemeMenu = () => {
    const stored = localStorage.getItem("codementor-lecturer-theme") as ThemePreference | null;
    setTheme(stored ?? "system");
    setThemeOpen((value) => !value);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <button
        aria-label="Thu gọn menu"
        className="hidden size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
        onClick={onDesktopToggle}
        type="button"
      >
        <PanelLeft aria-hidden="true" className="size-4" />
      </button>
      <button
        aria-label="Mở menu"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        onClick={onMobileToggle}
        type="button"
      >
        <Menu aria-hidden="true" className="size-4" />
      </button>

      <div className="flex-1" />

      <div className="relative">
        <button
          aria-expanded={themeOpen}
          aria-haspopup="menu"
          aria-label="Chọn giao diện"
          className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={toggleThemeMenu}
          type="button"
        >
          <ThemeIcon aria-hidden="true" className="size-4" />
        </button>
        {themeOpen && (
          <div
            className="absolute right-0 top-11 w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            role="menu"
          >
            {(
              [
                ["light", "Sáng", Sun],
                ["dark", "Tối", Moon],
                ["system", "Theo hệ thống", Monitor],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                className={
                  theme === value
                    ? "flex h-8 w-full items-center gap-2 rounded-md bg-muted px-2 text-sm"
                    : "flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                }
                key={value}
                onClick={() => selectTheme(value)}
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

      <button
        aria-label="Đăng xuất"
        className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={signOut}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
      </button>
    </header>
  );
}
