import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Omitted on the last item — that one is the current page, not a destination. */
  href?: string;
}

/**
 * The trail, and the only "back" affordance a page gets. A hand-written `← Quay lại X`
 * link hardcodes a guess about where the user came from and is wrong the moment a second
 * page links in; the previous crumb is always right.
 *
 * Rendered by the application shell from its route map, never by an individual page.
 */
export function Breadcrumb({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {isLast || !item.href ? (
                // The current page is announced, not linked — a link to where you already
                // are is a dead control for anyone navigating by keyboard.
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="truncate font-semibold text-foreground"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
