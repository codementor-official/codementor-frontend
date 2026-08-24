import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/** Native `<select>`, styled to match `Input`/`Button` — used inside `FilterBar`-style
 * filter rows. Native (not a custom listbox) so it stays fully accessible/keyboard-operable
 * for free; only worth replacing with a custom popover if a page needs richer option content
 * (icons, descriptions) than a native select can render.
 *
 * One shape only. It used to offer `pill` alongside `box`, which meant the same control
 * rounded differently depending on which screen it landed on; the pill went away with
 * FilterBar's. */
export function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
  containerClassName = "",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}) {
  const fullWidth = /(^|\s)w-full(\s|$)/.test(className);
  return (
    <div
      className={`relative inline-flex min-w-0 max-w-full align-middle ${
        fullWidth ? "w-full" : "w-fit justify-self-start"
      } ${containerClassName}`}
    >
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`h-9 min-w-0 appearance-none rounded-md border border-border bg-card py-0 pr-9 pl-3 text-xs font-semibold text-foreground outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 shrink-0 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
