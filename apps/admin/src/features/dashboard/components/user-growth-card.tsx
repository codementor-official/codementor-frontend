"use client";

import { ChartNoAxesCombined } from "lucide-react";
import {
  Area,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader } from "@codementor/ui";
import { userGrowthData } from "@/features/dashboard/data/dashboard.mock";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

export function UserGrowthCard() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border bg-background">
            <ChartNoAxesCombined aria-hidden="true" className="size-4" />
          </span>
          <h2 className="text-base font-semibold">User Growth</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />This Year</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Previous Year</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-2xl font-semibold tracking-tight sm:text-[28px]">12,486</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total users this year</p>
        <div className="mt-5 h-[290px] w-full sm:h-[312px]">
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart data={userGrowthData} margin={{ bottom: 0, left: -18, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="activeUsersFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
              <XAxis axisLine={false} dataKey="month" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis axisLine={false} fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
              <Area dataKey="active" fill="url(#activeUsersFill)" stroke="none" type="linear" />
              <Line dataKey="previous" dot={false} name="Previous Year" stroke="var(--chart-2)" strokeWidth={1.5} type="linear" />
              <Line activeDot={{ r: 4 }} dataKey="active" dot={{ fill: "var(--chart-1)", r: 2.3, strokeWidth: 0 }} name="This Year" stroke="var(--chart-1)" strokeWidth={2} type="linear" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
