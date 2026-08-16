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
  className = "",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    // `inline-block` so the wrapper hugs the select. As a block element it stretched to
    // fill its parent (a grid cell, a flex row), leaving the chevron floating in the gap.
    <div className="relative inline-block w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full appearance-none rounded-md border border-border bg-card py-0 pr-8 pl-3 text-xs font-semibold text-foreground focus:border-foreground sm:w-auto ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
