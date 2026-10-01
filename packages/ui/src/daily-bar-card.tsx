"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "./card";

/** "2026-09-27" → "27/9". */
const dayLabel = (date: string) => {
  const [, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}`;
};

/**
 * Cột theo ngày, MỘT chuỗi số liệu. Các số phụ (số đạt, số lỗi…) đi vào tooltip qua `describe`,
 * không vẽ chồng màu: cặp màu nhấn + xám của theme không đủ tương phản cho hai chuỗi trên nền
 * sáng (đã chạy bộ kiểm bảng màu).
 */
export function DailyBarCard<T extends { date: string }>({
  title,
  data,
  value,
  describe,
}: {
  title: string;
  data: T[];
  value: keyof T & string;
  describe: (point: T) => string;
}) {
  const rows = data.map((point) => ({ ...point, label: dayLabel(point.date) }));
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-sm font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-60 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={rows} margin={{ bottom: 0, left: -12, right: 4, top: 4 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={11}
                interval="preserveStartEnd"
                minTickGap={12}
                stroke="var(--muted-foreground)"
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickFormatter={(tick: number) => tick.toLocaleString("vi-VN")}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const point = active ? (payload?.[0]?.payload as T | undefined) : undefined;
                  if (!point) return null;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
                      <p className="font-medium">{point.date.split("-").reverse().join("/")}</p>
                      <p className="mt-1 text-muted-foreground">{describe(point)}</p>
                    </div>
                  );
                }}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey={(point: T) => point[value]} fill="var(--chart-3)" maxBarSize={28} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
