"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SegmentedTabs, type SegmentedTabOption } from "@codementor/ui";

/**
 * The frame all three studios share: a compact header strip, then a body that fills the
 * rest of the viewport so the split panes inside it have a height to divide.
 *
 * The three pages had grown identical copies of the back link, title, status line,
 * rejection notice, error and save-notice blocks — five stacked bordered strips before any
 * content. Here they occupy two rows.
 */
export function StudioShell({
  backHref,
  backLabel,
  title,
  slug,
  status,
  meta,
  actions,
  tabs,
  rejectionReason,
  error,
  notice,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  slug: string;
  /** StatusBadge for the current workflow state. */
  status: ReactNode;
  /** One line of counts — chapters, lessons, hours. */
  meta?: string;
  actions: ReactNode;
  tabs?: { options: SegmentedTabOption[]; value: string; onChange: (value: string) => void };
  rejectionReason?: string | null;
  error?: string | null;
  notice?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            href={backHref}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {backLabel}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold">{title}</h1>
              {status}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {slug}
              {meta && ` · ${meta}`}
            </p>
          </div>

          {tabs && (
            <SegmentedTabs onChange={tabs.onChange} options={tabs.options} value={tabs.value} />
          )}
          {actions}
        </div>

        {/* Only ever one of these is on screen at a time in practice, so they share the row
            below the title rather than each claiming a strip of their own. */}
        {rejectionReason && (
          <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            Lý do bị trả về: {rejectionReason}
          </p>
        )}
        {error && (
          <p
            className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-2 text-xs text-muted-foreground" role="status">
            {notice}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** Scrollable, padded region for a studio tab that is a form rather than a pane split. */
export function StudioScroll({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto px-3 py-3">{children}</div>;
}
