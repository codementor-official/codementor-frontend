"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { XIcon as X } from "@phosphor-icons/react/ssr";

const widthClasses = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

/**
 * Overlay dialog. Closes on backdrop click and Escape, locks body scroll while open.
 * Kept deliberately small — it renders whatever children it's given rather than
 * prescribing a body layout.
 *
 * Portaled to `document.body`: rendered in place, a modal opened from a dropdown
 * (`absolute z-10`) was trapped in that stacking context, so the header and the menu
 * itself painted over the backdrop.
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

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  if (!open || !mounted) return null;

  // z-50 matches --z-modal. The --z-* tokens are documentation only — Tailwind doesn't
  // generate z utilities from them (onboarding-modal hardcodes the same value).
  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-fixed/55 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-modal-in my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-lg bg-card shadow-[0_24px_60px_rgba(0,0,0,0.3)] ${widthClasses[width]}`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start gap-4 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-card px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const noopSubscribe = () => () => {};
