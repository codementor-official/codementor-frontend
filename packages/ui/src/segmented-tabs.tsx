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
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-card p-1 ${className}`}
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
              active ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
            {typeof opt.count === "number" && (
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? "bg-background/20 text-primary-foreground" : "bg-muted text-muted-foreground"
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
