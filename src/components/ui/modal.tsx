"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

const widthClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

/**
 * Overlay dialog. Closes on backdrop click and Escape, locks body scroll while open.
 * Kept deliberately small — it renders whatever children it's given rather than
 * prescribing a body layout.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  width = "md",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  width?: keyof typeof widthClasses;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // z-150 matches --z-modal. The --z-* tokens are documentation only — Tailwind doesn't
  // generate z utilities from them (onboarding-modal hardcodes the same value).
  return (
    <div
      className="animate-overlay-in fixed inset-0 z-150 flex items-start justify-center overflow-y-auto bg-ink-fixed/55 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-modal-in my-auto w-full rounded-xl bg-surface shadow-modal ${widthClasses[width]}`}
      >
        <div className="flex items-start gap-4 border-b border-border-soft px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-navy">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-faint hover:bg-bg hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border-soft px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
