import { AlertTriangle, CircleCheck, Info, OctagonAlert } from "lucide-react";
import type { UsageLevel } from "@codementor/types";
import { usagePercent } from "@codementor/utils";

const LEVEL: Record<UsageLevel, { text: string; bar: string; icon: typeof Info; tone: string }> = {
  ok: { text: "", bar: "bg-navy", icon: CircleCheck, tone: "text-text-muted" },
  info: { text: "Đã dùng hơn 70%", bar: "bg-navy", icon: Info, tone: "text-text-muted" },
  warning: { text: "Sắp hết hạn mức", bar: "bg-primary", icon: AlertTriangle, tone: "text-primary" },
  reached: { text: "Đã đạt hạn mức", bar: "bg-danger", icon: OctagonAlert, tone: "text-danger" },
};

/** Usage against a limit. The level is spelled out in words, never by colour alone. */
export function UsageMeter({
  label,
  used,
  limit,
  level,
  display,
}: {
  label: string;
  used: number;
  limit: number | null;
  level: UsageLevel;
  /** e.g. "3 / 5 nhóm" or "1,4 GB / 2 GB". */
  display: string;
}) {
  const style = LEVEL[level];
  const percent = usagePercent(used, limit);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="font-semibold text-navy">{display}</span>
      </div>
      {limit !== null && (
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-border-soft"
          role="meter"
          aria-label={label}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${display}${style.text ? `, ${style.text.toLowerCase()}` : ""}`}
        >
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${percent}%` }} />
        </div>
      )}
      {style.text && (
        <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${style.tone}`}>
          <style.icon className="h-3.5 w-3.5" aria-hidden /> {style.text}
        </p>
      )}
    </div>
  );
}
