import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform performance and operational activity.</p>
      </div>
      <Button aria-label="Select dashboard date range" className="w-fit" variant="outline">
        <CalendarDays aria-hidden="true" className="size-4" />
        Last 28 days
      </Button>
    </div>
  );
}
