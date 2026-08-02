"use client";

export interface SegmentedTabOption {
  value: string;
  label: string;
  count?: number;
}

export function SegmentedTabs({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentedTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1 ${className}`}
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
            className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
              active ? "bg-navy text-white" : "text-text-muted hover:bg-bg hover:text-navy"
            }`}
          >
            {opt.label}
            {typeof opt.count === "number" && (
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-white/20" : "bg-border-soft text-text-faint"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
