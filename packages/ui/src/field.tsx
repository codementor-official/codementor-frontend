import type { ReactNode } from "react";
import { InfoHint } from "./info-hint";

/**
 * Bộ đếm ký tự — CHỈ dành cho một số textarea văn xuôi (lý do, mô tả, giới thiệu, tóm
 * tắt…), không gắn vào ô một dòng, ô chat, ô code hay ô tìm kiếm. Đếm trên chuỗi đã trim
 * vì đó là thứ được gửi đi. Đỏ khi vượt trần; khi có `min` thì nhắc mức tối thiểu cho tới
 * lúc đạt.
 */
export function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const size = value.trim().length;
  const over = size > max;
  return (
    <span
      className={`shrink-0 text-xs tabular-nums ${over ? "font-medium text-destructive" : "text-muted-foreground"}`}
    >
      {size.toLocaleString("vi-VN")}/{max.toLocaleString("vi-VN")}
      {min !== undefined && size < min ? ` · tối thiểu ${min}` : ""}
    </span>
  );
}

/** Id của dòng lỗi dưới ô — trỏ `aria-describedby` của ô nhập vào đây. */
export const fieldErrorId = (htmlFor: string) => `${htmlFor}-error`;

/** Thuộc tính a11y cho ô nhập nằm trong `Field`: đánh dấu sai và nối với dòng lỗi. */
export function fieldA11y(htmlFor: string, error: string | undefined) {
  return {
    id: htmlFor,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? fieldErrorId(htmlFor) : undefined,
  } as const;
}

/**
 * Dòng lỗi đứng riêng — cho ô không nằm trong `Field` (ô tìm kiếm trên thanh lọc…). Ô nhập
 * trải `fieldA11y(htmlFor, error)` để trỏ vào đây.
 */
export function FieldError({ htmlFor, error, className = "" }: { htmlFor: string; error?: string; className?: string }) {
  if (!error) return null;
  return (
    <p className={`text-sm text-destructive ${className}`} id={fieldErrorId(htmlFor)} role="alert">
      {error}
    </p>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  /** Lời giải thích cho trường này. Nằm trong tooltip cạnh nhãn, xem `InfoHint`. */
  hint?: string;
  /** Dòng mô tả luôn hiện dưới ô (khoảng giá trị, đơn vị…) — khác `hint` nằm trong tooltip. */
  description?: ReactNode;
  error?: string;
  /** Bộ đếm ký tự — chỉ truyền cho textarea văn xuôi, xem `CharCount`. */
  counter?: { value: string; max: number; min?: number };
  /** Spans both columns of a two-column form — for a textarea or a long URL. */
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * One field: label above input, lỗi và bộ đếm bên dưới. Spacing comes from the form's grid
 * gap rather than a margin here, so a field can sit in either column of a two-column form.
 *
 * Lỗi hiện thẳng dưới ô — đó là thứ đang chặn người ta lưu, không được giấu vào tooltip
 * như phần mô tả. Ô nhập bên trong nên trải `fieldA11y(htmlFor, error)`.
 */
export function Field({
  label,
  htmlFor,
  hint,
  description,
  error,
  counter,
  wide,
  className,
  children,
}: FieldProps) {
  return (
    <div className={[wide ? "sm:col-span-2" : "", className ?? ""].join(" ").trim() || undefined}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" htmlFor={htmlFor}>
        {label}
        {hint && <InfoHint text={hint} />}
      </label>
      {children}
      {(error || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-3">
          {error ? <FieldError error={error} htmlFor={htmlFor} /> : <span />}
          {counter && <CharCount {...counter} />}
        </div>
      )}
      {description && <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
