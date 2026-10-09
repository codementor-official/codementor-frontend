"use client";

import { FieldError, fieldA11y } from "@codementor/ui";
import { dateRange } from "@codementor/utils";

const inputClass =
  "h-9 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:border-foreground";

/** Lỗi của cặp lọc "cập nhật từ/đến" — trang dùng để không gọi API khi khoảng ngược. */
export const updatedRangeError = (from: string, to: string) =>
  dateRange(from, to, { label: "Ngày cập nhật đến" });

/**
 * Cặp ô lọc "Cập nhật từ / đến ngày" dùng chung cho các trang quản lý nội dung (khóa
 * học, bài tập, lộ trình). Ngày đến trước ngày từ thì báo lỗi ngay dưới cặp ô.
 */
export function UpdatedRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const error = updatedRangeError(from, to);
  return (
    <>
      <input
        aria-label="Cập nhật từ ngày"
        className={inputClass}
        onChange={(event) => onFromChange(event.target.value)}
        type="date"
        value={from}
      />
      <input
        {...fieldA11y("updated-to", error)}
        aria-label="Cập nhật đến ngày"
        className={inputClass}
        onChange={(event) => onToChange(event.target.value)}
        type="date"
        value={to}
      />
      <FieldError className="w-full text-xs" error={error} htmlFor="updated-to" />
    </>
  );
}
