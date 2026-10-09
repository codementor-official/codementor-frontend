"use client";

import { ReactNode, useId, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { search as searchRule } from "@codementor/utils";
import { FieldError, fieldA11y } from "./field";

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  controls,
  activeFilterCount = 0,
  onClearFilters,
  sheetTitle = "Bộ lọc",
  className = "",
  searchMaxLength = 200,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  controls?: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  sheetTitle?: string;
  className?: string;
  /** Trần `q` của endpoint phía sau — mặc định 200 như `PageQuery` ở backend. */
  searchMaxLength?: number;
}) {
  // Từ khoá quá trần được giữ TẠI ĐÂY (để người dùng thấy và sửa) chứ không đẩy lên trang:
  // trang vẫn lọc theo từ khoá hợp lệ gần nhất, nên không bao giờ gọi API với `q` sai.
  const [overflow, setOverflow] = useState<string | null>(null);
  const shown = overflow ?? searchValue;
  const searchError = searchRule(shown, searchMaxLength);
  const searchId = useId();
  // Open as soon as a filter is set, so a filter that is doing something is never hidden.
  const [open, setOpen] = useState(false);
  const expanded = open || activeFilterCount > 0;

  return (
    // No bottom margin of its own: the caller is the only thing that knows what sits
    // underneath. It used to carry `mb-5` while ManagePage wrapped it in `mb-4`, and the
    // two silently added up.
    <div className={className}>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card py-1.5 pr-2 pl-3 focus-within:border-foreground">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          {...fieldA11y(searchId, searchError)}
          aria-label={searchPlaceholder}
          value={shown}
          onChange={(e) => {
            const value = e.target.value;
            if (searchRule(value, searchMaxLength)) {
              setOverflow(value);
            } else {
              setOverflow(null);
              onSearchChange(value);
            }
          }}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {controls && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={expanded}
            aria-label={`${sheetTitle}${activeFilterCount > 0 ? `, ${activeFilterCount} bộ lọc đang áp dụng` : ""}`}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{sheetTitle}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
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

      <FieldError className="mt-1.5" error={searchError} htmlFor={searchId} />

      {/* Inline, in the page flow — never a popover or a bottom sheet. An overlay covered
        * the results the filters were meant to narrow, on both desktop and mobile. */}
      {controls && expanded && (
        <div className="mt-2 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">{controls}</div>
        </div>
      )}
    </div>
  );
}
