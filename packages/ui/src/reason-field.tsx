"use client";

import { useState } from "react";
import { REASON_MAX, REASON_MIN, reason as reasonRule } from "@codementor/utils";
import { Field, fieldA11y } from "./field";

/**
 * Ô "lý do" dùng chung cho mọi thao tác cần giải thích: gỡ, từ chối, hoàn tiền, duyệt,
 * xoá thành viên… Một luật cho tất cả (3–500 ký tự, xem `reason` ở `@codementor/utils`),
 * có bộ đếm, lỗi hiện dưới ô sau khi người dùng bắt đầu gõ hoặc khi nơi gọi bật
 * `showError` (lúc bấm xác nhận).
 *
 * Nơi gọi kiểm `reason(value)` (từ `@codementor/utils`) trước khi gửi và gửi bản đã trim.
 */
export function ReasonField({
  id,
  label = "Lý do",
  value,
  onChange,
  placeholder,
  showError = false,
  autoFocus,
  className = "min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:border-ring",
  rows,
  disabled,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Hiện lỗi kể cả khi chưa gõ — bật khi người dùng đã bấm xác nhận. */
  showError?: boolean;
  autoFocus?: boolean;
  className?: string;
  rows?: number;
  disabled?: boolean;
}) {
  const [dirty, setDirty] = useState(false);
  const error = dirty || showError ? reasonRule(value, label) : undefined;
  return (
    <Field
      counter={{ value, max: REASON_MAX, min: REASON_MIN }}
      error={error}
      htmlFor={id}
      label={label}
    >
      <textarea
        {...fieldA11y(id, error)}
        autoFocus={autoFocus}
        className={className}
        disabled={disabled}
        onChange={(event) => {
          setDirty(true);
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </Field>
  );
}
