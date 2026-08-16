import { Check, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * The daily-streak widget. It existed twice — once on the dashboard as seven flex cells
 * with a Flame in each active day, once on /practice as a `grid-cols-7` with a Check —
 * same data, same meaning, two sets of markup that drifted apart. One component now.
 */
export function StreakCard({
  days,
  hint,
}: {
  /** One entry per day, oldest first. */
  days: { label: string; active: boolean }[];
  /** One line of context under the row, e.g. what keeps the streak alive today. */
  hint?: string;
}) {
  const current = days.filter((day) => day.active).length;

  return (
    <Card className="p-4">
      <div className="mb-3.5 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
          <Flame className="h-4 w-4 text-primary" /> Chuỗi ngày
        </span>
        <span className="text-base font-bold text-primary">{current} ngày</span>
      </div>
      <div className="flex justify-between gap-1.5">
        {days.map((day) => (
          <div key={day.label} className="flex-1 text-center">
            <div
              className={`mb-1 flex h-8 items-center justify-center rounded-md ${
                day.active ? "bg-primary text-on-ink" : "bg-border-soft"
              }`}
            >
              {day.active && <Check className="h-4 w-4" />}
            </div>
            <div className="text-2xs font-medium text-text-faint">{day.label}</div>
          </div>
        ))}
      </div>
      {hint && (
        <p className="mt-3 border-t border-border-soft pt-3 text-xs leading-relaxed text-text-muted">
          {hint}
        </p>
      )}
    </Card>
  );
}
