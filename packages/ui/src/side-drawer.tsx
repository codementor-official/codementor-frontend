"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/** Reusable right-side detail surface. Keep long-running list context visible beneath it. */
export function SideDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "default" | "wide";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`animate-drawer-in flex h-full w-full flex-col bg-card shadow-[0_24px_60px_rgba(0,0,0,0.3)] ${width === "wide" ? "max-w-6xl" : "max-w-2xl"}`}
      >
        <header className="flex items-start gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">{footer}</footer>}
      </aside>
    </div>
  );
}
