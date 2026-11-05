"use client";

import { useState } from "react";
import { ServerPagination } from "@codementor/ui";

/**
 * One page of a list the API returns whole (coupons, a drawer's orders or redemptions), with the
 * same footer as the server-paged tabs. The page clamps when the list shrinks under it.
 */
export function usePaged<T>(items: readonly T[] | null | undefined, size: number) {
  const [page, setPage] = useState(1);
  const total = items?.length ?? 0;
  const current = Math.min(page, Math.max(1, Math.ceil(total / size)));
  return {
    rows: items?.slice((current - 1) * size, current * size) ?? [],
    footer: total > size ? <ServerPagination page={current} total={total} pageSize={size} onPageChange={setPage} /> : null,
  };
}
