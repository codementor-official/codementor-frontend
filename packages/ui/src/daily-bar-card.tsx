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
  formatTick,
  emptyText = "Chưa có số liệu nào trong khoảng này.",
}: {
  title: string;
  data: T[];
  value: keyof T & string;
  describe: (point: T) => string;
  formatTick?: (value: number) => string;
  /** Hiện thay cho biểu đồ khi mọi ngày đều bằng 0. */
  emptyText?: string;
}) {
  const rows = data.map((point) => ({ ...point, label: dayLabel(point.date) }));
  // Toàn số 0 thì chỉ còn lưới và trục, đọc như biểu đồ hỏng chứ không như "chưa có gì".
  const empty = data.every((point) => !Number(point[value]));
  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="text-sm font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="pb-4">
        {empty ? (
          <p className="flex h-60 items-center justify-center rounded-md border border-dashed px-4 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
        <div className="h-60 w-full">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={rows} margin={{ bottom: 0, left: formatTick ? 0 : -12, right: 4, top: 4 }}>
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
                width={formatTick ? 72 : 60}
                allowDecimals={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickFormatter={formatTick ?? ((tick: number) => tick.toLocaleString("vi-VN"))}
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
        )}
      </CardContent>
    </Card>
  );
}
