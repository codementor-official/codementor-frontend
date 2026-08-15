"use client";

import { useEffect, useState, type ReactNode } from "react";

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
  /** Identifies the record. Changing it refetches — the drawer is reused between rows. */
  dependency,
}: {
  load: () => Promise<T>;
  children: (data: T) => ReactNode;
  dependency: string;
}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Closing the drawer mid-flight must not write into an unmounted component, and
    // clicking a second row before the first resolves must not show the first row's data.
    let cancelled = false;
    setData(null);
    setError(null);
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
    // `load` is a fresh closure every render; `dependency` is what actually identifies it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency]);

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

/** Label/value pair — the shape every drawer's metadata block already used. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}

/** Heading above a block of real content, as opposed to a metadata row. */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
