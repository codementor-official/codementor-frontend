import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MetricStrip } from "@/features/dashboard/components/metric-strip";
import { OperationsOverview } from "@/features/dashboard/components/operations-overview";
import { SecondaryMetrics } from "@/features/dashboard/components/secondary-metrics";
import { UserGrowthCard } from "@/features/dashboard/components/user-growth-card";
import { UsersByRoleCard } from "@/features/dashboard/components/users-by-role-card";

export function AdminDashboardPage() {
  return (
    <div>
      <div className="hidden xl:block"><DashboardHeader /></div>
      <div className="xl:mt-6"><MetricStrip /></div>
      <div className="mt-4 grid min-w-0 gap-4 sm:mt-6 xl:grid-cols-[minmax(0,1fr)_410px]">
        <UserGrowthCard />
        <UsersByRoleCard />
      </div>
      <div className="mt-4 sm:mt-6"><SecondaryMetrics /></div>
      <div className="mt-4 sm:mt-6"><OperationsOverview /></div>
    </div>
  );
}
