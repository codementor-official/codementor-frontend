"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The one topbar all three applications render: a way into the menu on mobile, the
 * breadcrumb trail, and whatever account controls that application has.
 *
 * The trail is a required prop, not an optional slot. It is the only thing on this row
 * that every page needs and no page can render for itself, and the two consoles shipped
 * without one — a title string that repeated the page heading below it.
 */
export function AppTopbar({
  breadcrumb,
  brand,
  onMobileMenu,
  actions,
}: {
  breadcrumb: ReactNode;
  /** Logo shown only below `md`, where the sidebar is off-screen. */
  brand?: ReactNode;
  /** Absent means this application has no mobile drawer. */
  onMobileMenu?: () => void;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-5">
      {onMobileMenu && (
        <button
          aria-label="Mở menu"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={onMobileMenu}
          type="button"
        >
          <Menu aria-hidden="true" className="size-4" />
        </button>
      )}
      {brand && <div className="shrink-0 md:hidden">{brand}</div>}
      <div className="min-w-0 flex-1">{breadcrumb}</div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
