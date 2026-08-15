import type { LucideIcon } from "lucide-react";

export interface CategoryFilterOption {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Kaggle's "All Competitions / Featured / Hackathons..." row — a bordered card per category
 * (icon + bold label + one-line description), not a plain pill. Heavier than `SegmentedTabs`
 * on purpose: this is for a page's top-level content-type switch, where the description is
 * what actually helps someone pick, not just the label. */
export function CategoryFilterCards({
  options,
  value,
  onChange,
}: {
  options: CategoryFilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors ${
              active ? "border-navy bg-bg" : "border-border bg-surface hover:border-navy/40"
            }`}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-bold text-navy">{opt.label}</span>
              <opt.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-text-faint"}`} />
            </div>
            <span className="text-xs leading-snug text-text-faint">{opt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
