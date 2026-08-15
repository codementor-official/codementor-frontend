"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Command,
  Menu,
  Monitor,
  Moon,
  PanelLeft,
  Search,
  Sun,
  X,
} from "lucide-react";

type ThemePreference = "light" | "dark" | "system";

interface AdminTopbarProps {
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

export function AdminTopbar({ onDesktopToggle, onMobileToggle }: AdminTopbarProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setThemeOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectTheme = (preference: ThemePreference) => {
    setTheme(preference);
    localStorage.setItem("codementor-admin-theme", preference);
    applyTheme(preference);
    setThemeOpen(false);
  };

  const toggleThemeMenu = () => {
    const stored = localStorage.getItem("codementor-admin-theme") as ThemePreference | null;
    setTheme(stored ?? "system");
    setThemeOpen((value) => !value);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[69px] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
        <button
          aria-label="Toggle sidebar"
          className="hidden size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
          onClick={onDesktopToggle}
          type="button"
        >
          <PanelLeft aria-hidden="true" className="size-4" />
        </button>
        <button
          aria-label="Open sidebar"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={onMobileToggle}
          type="button"
        >
          <Menu aria-hidden="true" className="size-4" />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">CodeMentor Admin</span>

        <button
          aria-label="Open command search"
          className="flex h-9 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:w-9 sm:justify-start lg:w-[250px]"
          onClick={() => setCommandOpen(true)}
          type="button"
        >
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="hidden truncate lg:inline">Search users, courses, exercises...</span>
          <kbd className="ml-auto hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground xl:flex">
            <Command aria-hidden="true" className="size-2.5" />K
          </kbd>
        </button>

        <button
          aria-label="Notifications, 3 unread"
          className="relative flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
        >
          <Bell aria-hidden="true" className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
            3
          </span>
        </button>

        <div className="relative hidden sm:block">
          <button
            aria-expanded={themeOpen}
            aria-haspopup="menu"
            aria-label="Choose theme"
            className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={toggleThemeMenu}
            type="button"
          >
            <ThemeIcon aria-hidden="true" className="size-4" />
          </button>
          {themeOpen && (
            <div className="absolute right-0 top-11 w-36 rounded-lg border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]" role="menu">
              {([
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
                ["system", "System", Monitor],
              ] as const).map(([value, label, Icon]) => (
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
      </header>

      {commandOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[14vh]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setCommandOpen(false);
          }}
          role="dialog"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
            <div className="flex h-12 items-center gap-3 border-b px-4">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <input
                aria-label="Admin search"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search users, courses, exercises..."
              />
              <button
                aria-label="Close command search"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setCommandOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Quick navigation</p>
              {[
                "Manage users",
                "Review reported exercises",
                "Open system activity",
              ].map((label) => (
                <button
                  className="flex h-9 w-full items-center rounded-md px-2 text-left text-sm hover:bg-muted"
                  key={label}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
