import type { ReactNode } from "react";
import { InfoHint } from "@/components/form/info-hint";

interface FieldProps {
  label: string;
  htmlFor: string;
  /** Lời giải thích cho trường này. Nằm trong tooltip cạnh nhãn, xem `InfoHint`. */
  hint?: string;
  error?: string;
  /** Spans both columns of a two-column form — for a textarea or a long URL. */
  wide?: boolean;
  children: ReactNode;
}

/**
 * One field: label above input. Spacing comes from the form's grid gap rather than a
 * margin here, so a field can sit in either column of a two-column form without its own
 * bottom margin fighting the row gap.
 *
 * Lỗi hiện thẳng dưới ô — đó là thứ đang chặn người ta lưu, không được giấu vào tooltip
 * như phần mô tả.
 */
export function Field({ label, htmlFor, hint, error, wide, children }: FieldProps) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" htmlFor={htmlFor}>
        {label}
        {hint && <InfoHint text={hint} />}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClassName =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring";

export const textareaClassName =
  "min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring";
