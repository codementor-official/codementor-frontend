import { CalendarDays } from "lucide-react";
import { Button } from "@codementor/ui";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Bảng điều khiển</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hiệu năng nền tảng và hoạt động vận hành.</p>
      </div>
      <Button aria-label="Chọn khoảng thời gian" className="w-fit" variant="outline">
        <CalendarDays aria-hidden="true" className="size-4" />
        Last 28 days
      </Button>
    </div>
  );
}
