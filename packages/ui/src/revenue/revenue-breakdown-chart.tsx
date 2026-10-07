"use client";
import {
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
import { chartColors, revenueMoney, revenueTick } from "./format";

export interface RevenueSegment {
  id: string;
  label: string;
  value: number;
  color?: string;
}

/** Every input value has the same unit and scope. Zero entries remain in detail tables. */
export function RevenueBreakdownChart({
  title,
  description,
  data,
  variant = "donut",
  unit = "VNĐ",
  onSelect,
}: {
  title: string;
  description: string;
  data: RevenueSegment[];
  variant?: "donut" | "ranking";
  unit?: "VNĐ" | "đơn";
  onSelect?: (id: string) => void;
}) {
  const sorted = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const total = sorted.reduce((sum, d) => sum + d.value, 0);
  const limit = variant === "ranking" ? 7 : 4;
  const visible = sorted.slice(0, limit);
  const remainder = sorted.slice(limit).reduce((sum, d) => sum + d.value, 0);
  const segments =
    variant === "donut" && remainder
      ? [
          ...visible,
          {
            id: "__other",
            label: `Khác (${sorted.length - limit})`,
            value: remainder,
          },
        ]
      : visible;
  const format = (value: number) =>
    unit === "VNĐ"
      ? revenueMoney(value)
      : `${value.toLocaleString("vi-VN")} đơn`;
  const select = (id: string) => {
    if (id && id !== "__other") onSelect?.(id);
  };
  const selectChart = (entry: unknown) => {
    const item = entry as { payload?: RevenueSegment; id?: string };
    select(item.payload?.id ?? item.id ?? "");
  };
  const tooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload?: RevenueSegment }[];
  }) => {
    const point = active ? payload?.[0]?.payload : undefined;
    return point ? (
      <div className="rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-sm">
        <p className="font-semibold">{point.label}</p>
        <p className="mt-1">
          {format(point.value)} ·{" "}
          {((100 * point.value) / total).toLocaleString("vi-VN", {
            maximumFractionDigits: 1,
          })}
          %
        </p>
      </div>
    ) : null;
  };
  return (
    <section className="h-full min-w-0 rounded-lg border bg-card p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description} · {unit}
      </p>
      {!total ? (
        <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
          Chưa có phát sinh để hiển thị phân bổ.
        </div>
      ) : variant === "ranking" ? (
        <>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segments}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  allowDecimals={unit !== "đơn"}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={
                    unit === "VNĐ"
                      ? revenueTick
                      : (v: number) => v.toLocaleString("vi-VN")
                  }
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={124}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(label: string) =>
                    label.length > 19 ? `${label.slice(0, 18)}…` : label
                  }
                  stroke="var(--muted-foreground)"
                />
                <Tooltip content={tooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar
                  dataKey="value"
                  fill="var(--chart-3)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={26}
                  isAnimationActive={false}
                  onClick={selectChart}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {Math.min(limit, sorted.length)} mục cao nhất / {sorted.length} có
            phát sinh{onSelect ? " · Chọn tên phía dưới để xem chi tiết." : "."}
          </p>
          {onSelect && (
            <div className="mt-3 flex flex-wrap gap-2">
              {visible.map((p) => (
                <button
                  key={p.id}
                  onClick={() => select(p.id)}
                  className="rounded-md border px-2 py-1 text-sm transition-colors hover:bg-muted"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div
            className="relative mt-4 h-64"
            role="img"
            aria-label={`${title}. Tổng ${format(total)}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="65%"
                  outerRadius="88%"
                  paddingAngle={segments.length > 1 ? 3 : 0}
                  stroke="var(--card)"
                  strokeWidth={3}
                  isAnimationActive={false}
                  onClick={selectChart}
                >
                  {segments.map((p, index) => (
                    <Cell
                      key={p.id}
                      fill={p.color ?? chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={tooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Tổng phân bổ
              </span>
              <strong
                className="mt-1 text-xl tabular-nums"
                title={format(total)}
              >
                {unit === "VNĐ" ? `${revenueTick(total)} ₫` : format(total)}
              </strong>
            </div>
          </div>
          <ul className="mt-2 space-y-2">
            {segments.map((p, index) => (
              <li key={p.id}>
                <button
                  disabled={!onSelect || p.id === "__other"}
                  onClick={() => select(p.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors enabled:hover:bg-muted disabled:cursor-default"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          p.color ?? chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="truncate" title={p.label}>
                      {p.label}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {((100 * p.value) / total).toLocaleString("vi-VN", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
