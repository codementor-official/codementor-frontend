"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function ServerPagination({
  page,
  total,
  pageSize = 20,
  disabled = false,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize?: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <span className="text-xs text-muted-foreground">
        {first}–{last} trên {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          aria-label="Trang trước"
          className="flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-20 px-2 text-center text-xs font-medium">
          Trang {page}/{pageCount}
        </span>
        <button
          aria-label="Trang sau"
          className="flex size-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
