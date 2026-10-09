// `Field` dùng chung cho cả ba app — sống ở `@codementor/ui`, xem `packages/ui/src/field.tsx`.
export { Field, fieldA11y } from "@codementor/ui";

export const inputClassName =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring";

export const textareaClassName =
  "min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring";
