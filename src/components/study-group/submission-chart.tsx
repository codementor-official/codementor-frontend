"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  label: string;
  value: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 shadow-dropdown">
      <div className="text-2xs font-semibold text-text-faint">{label}</div>
      <div className="text-sm font-bold text-navy">{payload[0].value} lượt nộp</div>
    </div>
  );
}

/**
 * Submissions per day. One series, so no legend — the card title names it — and no
 * value printed on every bar; the axis plus hover carry the numbers instead.
 */
export function SubmissionChart({ data }: { data: Point[] }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="28%">
          {/* Recessive grid: horizontal only, hairline, behind the marks. */}
          <CartesianGrid vertical={false} stroke="var(--color-border-soft)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-text-faint)" }}
          />
          <YAxis
            allowDecimals={false}
            width={40}
            tickCount={4}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-text-faint)" }}
          />
          <Tooltip cursor={{ fill: "var(--color-border-soft)" }} content={<ChartTooltip />} />
          <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
