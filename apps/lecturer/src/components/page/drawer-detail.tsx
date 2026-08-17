"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Loads the full record for whatever row the drawer is showing.
 *
 * The table rows carry list-shaped data — a title, a status, a count — which is all the
 * table needs and nothing a lecturer can actually read. The detail endpoints already
 * return the statement, the chapter tree, the course list; the drawer just has to ask.
 * Asking on open rather than with the list keeps a page of twenty rows at one request.
 */
export function DrawerDetail<T>({
  load,
  children,
}: {
  load: () => Promise<T>;
  children: (data: T) => ReactNode;
}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Closing the drawer mid-flight must not write into an unmounted component, and
    // clicking a second row before the first resolves must not show the first row's data.
    let cancelled = false;
    load()
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          // Backend messages say what is actually missing; a generic sentence would throw
          // that away.
          setError(cause instanceof Error ? cause.message : "Không tải được nội dung");
        }
      });
    return () => {
      cancelled = true;
    };
    // Fetch once per mount. Callers key this on the record id, so selecting another row
    // remounts rather than refetching in place — which is also why there is no state reset
    // here: a fresh mount starts empty on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!data) return <DetailSkeleton />;
  return <>{children(data)}</>;
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-2.5">
      {[0, 1, 2].map((row) => (
        <div className="h-4 animate-pulse rounded bg-muted" key={row} style={{ width: `${90 - row * 18}%` }} />
      ))}
    </div>
  );
}

/**
 * The metadata block: every label/value pair in one bordered card, two columns from `sm`.
 *
 * It used to be a full-width stack with a 112px label gutter, so six short facts — a slug,
 * a difficulty, a date — ate the top half of the drawer before any real content appeared.
 */
export function DetailMeta({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
      {children}
    </dl>
  );
}

/** One label/value pair inside `DetailMeta`. Label above value: it wraps at any width. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 min-w-0 truncate text-sm font-medium" title={typeof value === "string" ? value : undefined}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Heading above a block of real content, as opposed to a metadata row.
 *
 * The icon and the rule that runs out to the right edge are what separate one section
 * from the next; without them a drawer of four sections read as one long column of text.
 */
export function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <div className="mb-2.5 flex items-center gap-2">
        {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />}
        <h3 className="text-xs font-bold tracking-wide uppercase">{title}</h3>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}
