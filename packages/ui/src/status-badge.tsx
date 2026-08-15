import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

interface StatusBadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
