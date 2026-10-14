"use client";

import { FieldError, fieldA11y } from "@codementor/ui";
import { dateRange } from "@codementor/utils";

const boxClass =
  "flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs transition-colors focus-within:border-foreground";
const inputClass = "border-0 bg-transparent p-0 text-xs font-semibold text-foreground";

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
      {/* Nhãn nằm trong khung cùng chiều cao với các ô lọc khác: hai ô "dd/mm/yyyy" trần không
          cho biết lọc theo gì, ô nào là "từ", ô nào là "đến". */}
      <label className={boxClass}>
        <span className="text-muted-foreground">Cập nhật từ</span>
        <input
          aria-label="Cập nhật từ ngày"
          className={inputClass}
          max={to || undefined}
          onChange={(event) => onFromChange(event.target.value)}
          type="date"
          value={from}
        />
      </label>
      <label className={boxClass}>
        <span className="text-muted-foreground">đến</span>
        <input
          {...fieldA11y("updated-to", error)}
          aria-label="Cập nhật đến ngày"
          className={inputClass}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
          type="date"
          value={to}
        />
      </label>
      <FieldError className="w-full text-xs" error={error} htmlFor="updated-to" />
    </>
  );
}
