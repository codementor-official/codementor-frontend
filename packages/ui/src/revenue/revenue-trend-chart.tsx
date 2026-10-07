"use client";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueReport } from "@codementor/types";
import {
  metricValue,
  revenueDate,
  revenueMoney,
  revenueTick,
  type RevenueMetric,
} from "./format";

export function RevenueTrendChart({
  report,
  metric,
  onMetricChange,
  compareGross = false,
}: {
  report: RevenueReport;
  metric: RevenueMetric;
  onMetricChange: (value: RevenueMetric) => void;
  compareGross?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const share =
    report.scope === "admin" ? "Phần CodeMentor" : "Doanh thu của bạn";
  const labels = {
    revenue: share,
    gross: "Tiền học viên thanh toán",
    orders: "Số đơn",
    average: "Giá trị bình quân / đơn",
  };
  const unit = metric === "orders" ? "đơn" : "VNĐ";
  const data = report.daily.map((p) => ({
    ...p,
    value: metricValue(p, metric),
  }));
  const activeDays = data.filter((p) => p.value > 0).length;
  const comparing = compareGross && metric === "revenue";
  return (
    <section
      className="min-w-0 rounded-lg border bg-card p-5"
      aria-label="Xu hướng doanh thu"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Xu hướng theo ngày</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {revenueDate(report.from)} – {revenueDate(report.to)} · Giờ Việt Nam
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Chỉ số
          <select
            aria-label="Chỉ số biểu đồ"
            className="rounded-md border bg-background px-3 py-2 font-normal"
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as RevenueMetric)}
          >
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({key === "orders" ? "đơn" : "VNĐ"})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-chart-3" />
            {labels[metric]} · {unit}
          </span>
          {comparing && (
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-chart-1" />
              Tiền học viên thanh toán · VNĐ
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          {activeDays} / {data.length} ngày có{" "}
          {metric === "orders" ? "đơn" : "giá trị dương"}
        </span>
      </div>
      <div
        className="mt-4 h-80 min-w-0"
        role="img"
        aria-label={`${labels[metric]}${comparing ? " và tiền học viên thanh toán" : ""} theo ngày, đơn vị ${unit}. Số liệu chi tiết có ở mục Chi tiết.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => {
                const [, m, day] = d.split("-");
                return `${Number(day)}/${Number(m)}`;
              }}
              stroke="var(--muted-foreground)"
              fontSize={12}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              width={88}
              stroke="var(--muted-foreground)"
              fontSize={12}
              axisLine={false}
              tickLine={false}
              tickFormatter={
                metric === "orders"
                  ? (v: number) => v.toLocaleString("vi-VN")
                  : revenueTick
              }
              allowDecimals={metric !== "orders"}
            />
            <Tooltip
              content={({ active, payload }) => {
                const point = active
                  ? (payload?.[0]?.payload as (typeof data)[number] | undefined)
                  : undefined;
                return point ? (
                  <div className="rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-sm">
                    <p className="font-semibold">{revenueDate(point.date)}</p>
                    <p className="mt-2">
                      {labels[metric]}:{" "}
                      <strong>
                        {metric === "orders"
                          ? `${point.value} đơn`
                          : revenueMoney(point.value)}
                      </strong>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {comparing && (
                        <>
                          Tiền học viên thanh toán:{" "}
                          <strong>{revenueMoney(point.gross)}</strong>
                          <br />
                        </>
                      )}
                      {point.orders} đơn · Hoàn tiền{" "}
                      {revenueMoney(point.refunded)}
                    </p>
                  </div>
                ) : null;
              }}
            />
            {comparing && (
              <Area
                type="linear"
                dataKey="gross"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.06}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            )}
            <Area
              type="linear"
              dataKey="value"
              stroke="var(--chart-3)"
              fill={`url(#${id})`}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {comparing && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Hai đường không cộng dồn: tiền học viên thanh toán là giá trị toàn đơn
          (kể cả đơn đã hoàn); phần CodeMentor là khoản được phân bổ sau khi
          loại đơn hoàn tiền, trước phí cổng thanh toán.
        </p>
      )}
      {!activeDays && (
        <p className="mt-2 text-sm text-muted-foreground">
          Không có phát sinh cho chỉ số này trong kỳ đã chọn.
        </p>
      )}
    </section>
  );
}
