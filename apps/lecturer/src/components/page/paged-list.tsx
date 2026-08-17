"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { inputClassName } from "@/components/form/field";

/**
 * Search + paging for the in-studio pick lists (the course library, the exercise picker).
 *
 * Client-side on purpose: both lists are already fully loaded — the studio fetches 100
 * rows once — so filtering here costs nothing and a round trip per keystroke would cost
 * everything. Move it to the server the day those lists stop fitting in one request.
 */
export function usePagedList<T>(
  items: T[],
  match: (item: T, query: string) => boolean,
  pageSize = 6,
) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? items.filter((item) => match(item, needle)) : items;
    // `match` is a fresh closure at every call site; depending on it would rebuild the
    // list every render for no gain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamped rather than reset in an effect: after a filter change the old page number can
  // point past the end, and an effect would render the empty page once before fixing it.
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(1);
    },
    page: current,
    setPage,
    pageCount,
    total: filtered.length,
    visible,
  };
}

/** The search row above a pick list. `filters` sits beside the box — usually one Select. */
export function ListSearch({
  value,
  onChange,
  placeholder,
  filters,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  filters?: ReactNode;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          aria-label={placeholder}
          className={`${inputClassName} pl-8`}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </div>
      {filters}
    </div>
  );
}

export function ListPager({
  page,
  pageCount,
  total,
  onChange,
  unit,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
  /** Plural noun for the count, e.g. "khóa học". */
  unit: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>
        {total} {unit} · trang {page}/{pageCount}
      </span>
      <div className="flex items-center gap-1">
        <button
          aria-label="Trang trước"
          className="flex size-7 items-center justify-center rounded-md border disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>
        <button
          aria-label="Trang sau"
          className="flex size-7 items-center justify-center rounded-md border disabled:opacity-40"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
