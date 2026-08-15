import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** One sentence. If it needs two, the page is doing two things. */
  description?: string;
  /** The single primary action for this page. Row-level actions belong in the row. */
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
