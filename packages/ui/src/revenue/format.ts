import type { RevenueReport } from "@codementor/types";

export type RevenueMetric = "revenue" | "gross" | "orders" | "average";
export const revenueMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const revenueDate = (value: string) =>
  value.split("-").reverse().join("/");
export function revenueTick(value: number) {
  const [size, label] =
    Math.abs(value) >= 1e9
      ? [1e9, "tỷ"]
      : Math.abs(value) >= 1e6
        ? [1e6, "triệu"]
        : Math.abs(value) >= 1e3
          ? [1e3, "nghìn"]
          : [1, ""];
  return `${(value / Number(size)).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${label}`.trim();
}
export function metricValue(
  point: RevenueReport["daily"][number],
  metric: RevenueMetric,
) {
  return metric === "average"
    ? point.orders
      ? point.gross / point.orders
      : 0
    : point[metric];
}
export const chartColors = [
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-5)",
];
