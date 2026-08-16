"use client";

import { useEffect, useState } from "react";

export interface CatalogueState<T> {
  items: T[];
  isLoading: boolean;
  /** Set when the request failed. Empty-but-successful is `items: []` with `error: null`. */
  error: string | null;
}

/**
 * Loads one browse list from the backend.
 *
 * Deliberately small: no cache, no retry, no revalidation. The three catalogue pages each
 * fetch once on mount, and when a real data layer is chosen (React Query or the framework's
 * own caching) it replaces this file rather than being threaded through three call sites.
 *
 * An empty result is not an error. The backend genuinely has no published roadmaps or
 * courses yet, and a page that hides that behind mock data would be lying about the state
 * of the system — see the empty states each page renders instead.
 */
export function useCatalogue<T>(load: () => Promise<{ items: T[] }>): CatalogueState<T> {
  const [state, setState] = useState<CatalogueState<T>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    load()
      .then((page) => {
        if (!cancelled) setState({ items: page.items ?? [], isLoading: false, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const message =
          cause instanceof Error ? cause.message : "Không tải được dữ liệu từ máy chủ.";
        setState({ items: [], isLoading: false, error: message });
      });

    return () => {
      cancelled = true;
    };
    // `load` is a fresh closure each render at every call site, so depending on it would
    // refetch forever. The pages that need refetch-on-filter pass their filters to the
    // server instead of relying on this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
