import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** One sentence. If it needs two, the page is doing two things. */
  description?: string;
  /** Sits between the title and the action — where a screen's tab strip belongs, so it
   * shares this row instead of stacking a third bordered block above it. */
  center?: ReactNode;
  /** The single primary action for this page. Row-level actions belong in the row. */
  action?: ReactNode;
}

export function PageHeader({ title, description, center, action }: PageHeaderProps) {
  return (
    <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {center}
      {action}
    </header>
  );
}
