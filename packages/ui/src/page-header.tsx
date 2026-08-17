import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** One sentence. If it needs two, the page is doing two things. */
  description?: string;
  /** Square tile left of the title — the same anchor on every screen. */
  icon?: LucideIcon;
  /** Sits between the title and the action — where a screen's tab strip belongs, so it
   * shares this row instead of stacking a third bordered block above it. */
  center?: ReactNode;
  /** The single primary action for this page. Row-level actions belong in the row. */
  action?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, center, action }: PageHeaderProps) {
  return (
    <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-4.5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {center}
      {action}
    </header>
  );
}
