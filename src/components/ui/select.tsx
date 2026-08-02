import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/** Native `<select>`, styled to match `Input`/`Button` — used inside `FilterBar`-style
 * filter rows. Native (not a custom listbox) so it stays fully accessible/keyboard-operable
 * for free; only worth replacing with a custom popover if a page needs richer option content
 * (icons, descriptions) than a native select can render. */
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
    <div className="relative w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-full border border-border bg-surface py-2.5 pr-8 pl-3.5 text-xs font-semibold text-navy outline-none focus:border-navy sm:w-auto ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
    </div>
  );
}
