"use client";

import { ChartNoAxesCombined } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@codementor/ui";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

/** "2026-08" → "T8/26", đủ ngắn để 12 nhãn nằm vừa trục ngang. */
function monthLabel(month: string): string {
  const [year, index] = month.split("-");
  return `T${Number(index)}/${year?.slice(2) ?? ""}`;
}

/**
 * Tăng trưởng tài khoản theo tháng.
 *
 * Bản cũ vẽ hai đường "năm nay" và "năm trước" từ dữ liệu giả. Không có đường so sánh năm
 * trước ở đây vì nền tảng chưa chạy đủ một năm — vẽ nó ra là bịa. Hai chuỗi hiện tại đều
 * đến từ cùng một truy vấn: số tài khoản mới mỗi tháng, và tổng cộng dồn.
 */
export function UserGrowthCard({
  growth,
}: {
  growth: { month: string; newUsers: number; total: number }[];
}) {
  const data = growth.map((point) => ({ ...point, label: monthLabel(point.month) }));
  const latest = data.at(-1);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border bg-background">
            <ChartNoAxesCombined aria-hidden="true" className="size-4" />
          </span>
          <h2 className="text-base font-semibold">Tăng trưởng người dùng</h2>
        </div>
        <div className="flex items-center gap-3 text-2xs text-muted-foreground sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-1" />
            Tổng cộng dồn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-2" />
            Tài khoản mới
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          {(latest?.total ?? 0).toLocaleString("vi-VN")}
        </p>
        <p className="mt-1 text-2xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Tổng tài khoản tới {latest ? monthLabel(latest.month) : "—"}
        </p>
        <div className="mt-5 h-[290px] w-full sm:h-[312px]">
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart data={data} margin={{ bottom: 0, left: -18, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="totalUsersFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickLine={false}
              />
              {/* `allowDecimals={false}`: với vài chục tài khoản, thang tự động sẽ chia ra
                  0,5 người. Bản cũ chia cho 1000 và thêm "k" — số thật thì mọi vạch là 0k. */}
              <YAxis
                allowDecimals={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
              <Area dataKey="total" fill="url(#totalUsersFill)" stroke="none" type="linear" />
              <Line
                dataKey="newUsers"
                dot={false}
                name="Tài khoản mới"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                type="linear"
              />
              <Line
                activeDot={{ r: 4 }}
                dataKey="total"
                dot={{ fill: "var(--chart-1)", r: 2.3, strokeWidth: 0 }}
                name="Tổng cộng dồn"
                stroke="var(--chart-1)"
                strokeWidth={2}
                type="linear"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
