import { Activity, ArrowUpRight, Server } from "lucide-react";
import { Card, CardHeader, StatusBadge } from "@codementor/ui";
import { recentActivity, systemHealth } from "@/features/dashboard/data/dashboard.mock";

const activityTones = {
  Completed: "success",
  Published: "success",
  Review: "warning",
  Updated: "neutral",
} as const;

export function OperationsOverview() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg border bg-background">
              <Activity aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest administrative events</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" type="button">
            View all <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-medium">Activity</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Resource</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((item) => (
                <tr className="border-t transition-colors hover:bg-muted/40" key={`${item.activity}-${item.time}`}>
                  <td className="px-5 py-3 font-medium">{item.activity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.actor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.resource}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{item.time}</td>
                  <td className="px-5 py-3"><StatusBadge tone={activityTones[item.status]}>{item.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
            <Server aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">System Health</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">All services operational</p>
          </div>
        </CardHeader>
        <div className="divide-y px-5">
          {systemHealth.map((service) => (
            <div className="flex items-center gap-3 py-3" key={service.name}>
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm">{service.name}</span>
              <span className="text-xs text-muted-foreground">{service.latency}</span>
              <StatusBadge tone="success">{service.status}</StatusBadge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
