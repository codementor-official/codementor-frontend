"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Update<T> = T | ((previous: T) => T);

function parse<T extends string | number>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  if (typeof fallback === "number") {
    const value = Number(raw);
    return (Number.isFinite(value) ? value : fallback) as T;
  }
  return raw as T;
}

/**
 * `useState` for list state (page, tab, filter, sort) that lives in the query string, so
 * opening a row and pressing Back returns to the same page/tab/filter instead of the
 * defaults. The default value is never written to the URL.
 *
 * Writes go through `history.replaceState`, which Next syncs into `useSearchParams`. It is
 * synchronous, so `setTab(x); setPage(1)` in one handler both land — `router.replace`
 * would let the second call overwrite the first with a stale query string.
 *
 * Needs a `<Suspense>` above it; each app shell provides one around its pages.
 *
 * ponytail: string values are not validated — a hand-edited `?tab=xyz` renders whatever the
 * screen does for an unknown tab. Add an `allowed` list if a screen breaks on that.
 */
export function useUrlState(key: string, fallback: number): [number, (next: Update<number>) => void];
// NoInfer: `useUrlState("level", "all")` is a `string`, not the literal "all"; pass a union
// explicitly (`useUrlState<Tab>("tab", "overview")`) to narrow it.
export function useUrlState<T extends string = string>(
  key: string,
  fallback: NoInfer<T>,
): [T, (next: Update<T>) => void];
export function useUrlState<T extends string | number>(
  key: string,
  fallback: T,
): [T, (next: Update<T>) => void] {
  const value = parse(useSearchParams().get(key), fallback);

  const set = useCallback(
    (next: Update<T>) => {
      const params = new URLSearchParams(window.location.search);
      const resolved =
        typeof next === "function" ? next(parse(params.get(key), fallback)) : next;
      if (resolved === fallback || resolved === "") params.delete(key);
      else params.set(key, String(resolved));
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    },
    [key, fallback],
  );

  return [value, set];
}
