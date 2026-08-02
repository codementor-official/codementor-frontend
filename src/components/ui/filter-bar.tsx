"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  controls,
  activeFilterCount = 0,
  sheetTitle = "Bộ lọc",
  className = "",
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  controls: ReactNode;
  activeFilterCount?: number;
  sheetTitle?: string;
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
      className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-navy hover:bg-bg"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      {sheetTitle}
      {activeFilterCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );

  return (
    <div ref={wrapRef} className={`relative mb-5 ${className}`}>
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-2 pl-4 focus-within:border-navy">
        <Search className="h-4 w-4 shrink-0 text-text-faint" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-text-faint"
        />
        {filterButton}
      </div>

      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 hidden w-max max-w-full rounded-lg border border-border bg-surface p-4 shadow-dropdown sm:block">
          <div className="flex flex-wrap items-center gap-2.5">{controls}</div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end bg-navy/55 sm:hidden" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-navy">{sheetTitle}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label={`Đóng ${sheetTitle.toLowerCase()}`}>
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">{controls}</div>
          </div>
        </div>
      )}
    </div>
  );
}
