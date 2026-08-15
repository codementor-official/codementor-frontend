import { ArrowDownRight, ArrowUpRight, BookOpen, Code2, GraduationCap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dashboardMetrics } from "@/features/dashboard/data/dashboard.mock";
import type { DashboardMetric } from "@/features/dashboard/types/dashboard";

const metricIcons: Record<DashboardMetric["icon"], typeof Users> = {
  courses: BookOpen,
  lecturers: GraduationCap,
  submissions: Code2,
  users: Users,
};

export function MetricStrip() {
  return (
    <Card className="grid grid-cols-2 overflow-hidden xl:grid-cols-4">
      {dashboardMetrics.map((metric, index) => {
        const Icon = metricIcons[metric.icon];
        const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight;

        return (
          <div
            className={`min-w-0 p-3 sm:p-4 xl:p-6 ${index % 2 === 0 ? "border-r xl:border-r" : "xl:border-r"} ${index < 2 ? "border-b xl:border-b-0" : ""} ${index === dashboardMetrics.length - 1 ? "xl:border-r-0" : ""}`}
            key={metric.label}
          >
            <div className="mb-0.5 flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm xl:mb-1.5">
              <Icon aria-hidden="true" className="size-3.5 shrink-0 sm:size-4" strokeWidth={1.8} />
              <span className="truncate">{metric.label}</span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{metric.previous}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl xl:mt-2 xl:text-[28px]">{metric.value}</p>
            <div className="mt-0.5 flex items-center gap-1 text-[10px] sm:text-xs xl:mt-1.5">
              <span className={metric.trend === "up" ? "flex items-center text-success" : "flex items-center text-destructive"}>
                <TrendIcon aria-hidden="true" className="size-3.5" />
                {metric.change}
              </span>
              <span className="hidden text-muted-foreground sm:inline">vs last month</span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
