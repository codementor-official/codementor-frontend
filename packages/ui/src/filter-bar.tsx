"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  controls,
  activeFilterCount = 0,
  onClearFilters,
  sheetTitle = "Bộ lọc",
  displayMode = "popover",
  className = "",
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  controls: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  sheetTitle?: string;
  displayMode?: "popover" | "inline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click-outside / Escape close for the desktop dropdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filterButton = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      {sheetTitle}
      {activeFilterCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  return (
    // No bottom margin of its own: the caller is the only thing that knows what sits
    // underneath. It used to carry `mb-5` while ManagePage wrapped it in `mb-4`, and the
    // two silently added up.
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card py-1.5 pr-2 pl-3 focus-within:border-foreground">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {filterButton}
        {activeFilterCount > 0 && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-8 shrink-0 rounded-md px-2 text-xs font-semibold text-primary hover:bg-primary/10"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {open && (
        <div
          className={`${
            displayMode === "inline" ? "mt-2" : "absolute top-full right-0 z-20 mt-2 w-max max-w-full shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          } hidden rounded-lg border border-border bg-card p-4 sm:block`}
        >
          <div className="flex flex-wrap items-center gap-2.5">{controls}</div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/55 sm:hidden" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{sheetTitle}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label={`Đóng ${sheetTitle.toLowerCase()}`}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">{controls}</div>
          </div>
        </div>
      )}
    </div>
  );
}
