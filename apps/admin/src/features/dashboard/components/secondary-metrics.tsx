"use client";

import { Activity, ArrowUpRight, Braces, MoreHorizontal, PieChart as PieChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@codementor/ui";
import {
  dailyActiveUsersData,
  judgeExecutionsData,
  platformActivityData,
} from "@/features/dashboard/data/dashboard.mock";

function CardMenu({ label }: { label: string }) {
  return (
    <button
      aria-label={`${label} actions`}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      type="button"
    >
      <MoreHorizontal aria-hidden="true" className="size-4" />
    </button>
  );
}

export function SecondaryMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card className="min-w-0 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Activity aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Người dùng hoạt động hằng ngày</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-semibold">8,942</span>
              <span className="flex items-center text-xs text-success"><ArrowUpRight className="size-3.5" />4.8%</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
          <CardMenu label="Daily Active Users" />
        </div>
        <div className="mt-5 h-[190px]">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={dailyActiveUsersData} margin={{ bottom: 0, left: -28, right: 2, top: 8 }}>
              <defs>
                <linearGradient id="dailyUsersFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="day" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis axisLine={false} fontSize={10} stroke="var(--muted-foreground)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area dataKey="users" fill="url(#dailyUsersFill)" stroke="var(--chart-1)" strokeWidth={2} type="monotone" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>Aug 01</span><span>Aug 28</span>
        </div>
      </Card>

      <Card className="min-w-0 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Braces aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Lượt chấm bài</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-semibold">42,781</span>
              <span className="flex items-center text-xs text-success"><ArrowUpRight className="size-3.5" />9.3%</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
          <CardMenu label="Judge Executions" />
        </div>
        <div className="mt-4 flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />Tháng này</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Tháng trước</span>
        </div>
        <div className="mt-3 h-[178px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={judgeExecutionsData} margin={{ bottom: 0, left: -28, right: 2, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis axisLine={false} dataKey="name" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} />
              <YAxis axisLine={false} fontSize={10} stroke="var(--muted-foreground)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="thisMonth" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastMonth" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span>97.8% accepted by infrastructure</span><span>28 days</span>
        </div>
      </Card>

      <Card className="min-w-0 p-4 sm:p-5 md:col-span-2 xl:col-span-1">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
            <PieChartIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Hoạt động nền tảng</p>
            <p className="mt-1 text-xs text-muted-foreground">28 ngày gần nhất</p>
          </div>
          <CardMenu label="Platform Activity" />
        </div>
        <div className="mt-2 flex h-[150px] items-center justify-center">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie cx="50%" cy="50%" data={platformActivityData} dataKey="value" innerRadius={43} outerRadius={65} paddingAngle={1.5} stroke="var(--card)" strokeWidth={2}>
                {platformActivityData.map((item) => <Cell fill={item.fill} key={item.name} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(value) => [`${value}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 border-t pt-3">
          {platformActivityData.map((item) => (
            <div className="flex items-center text-xs" key={item.name}>
              <span className="mr-2 size-2 rounded-full" style={{ background: item.fill }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
