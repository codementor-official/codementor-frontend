import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * One field, one column, label above input. No two-column grid: a form read top to
 * bottom in a single line is the only layout that survives a narrow window without
 * a second set of rules.
 */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export const inputClassName =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring";

export const textareaClassName =
  "min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring";
