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
  shape = "pill",
  className = "",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** `pill` matches `FilterBar`'s rounded row; `box` matches the h-9 inputs in `TableToolbar`. */
  shape?: "pill" | "box";
  className?: string;
}) {
  const shapeClasses =
    shape === "pill" ? "rounded-full py-2.5 pl-3.5" : "h-9 rounded-md py-0 pl-3 text-xs";
  return (
    // `inline-block` so the wrapper hugs the select. As a block element it stretched to
    // fill its parent (a grid cell, a flex row), leaving the chevron floating in the gap.
    <div className="relative inline-block w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none border border-border bg-surface pr-8 text-xs font-semibold text-navy outline-none focus:border-navy sm:w-auto ${shapeClasses} ${className}`}
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
