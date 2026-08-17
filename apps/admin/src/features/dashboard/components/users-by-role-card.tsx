"use client";

import { UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@codementor/ui";

const ROLE_LABELS: Record<string, string> = {
  learner: "Học viên",
  lecturer: "Giảng viên",
  admin: "Quản trị",
};

/** Thứ tự cố định để cột không nhảy chỗ giữa hai lần tải. */
const ROLE_ORDER = ["learner", "lecturer", "admin"] as const;

export function UsersByRoleCard({
  byRole,
  total,
}: {
  byRole: Record<string, number>;
  total: number;
}) {
  const data = ROLE_ORDER.map((role) => ({
    name: ROLE_LABELS[role] ?? role,
    value: byRole[role] ?? 0,
  }));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <UsersRound aria-hidden="true" className="size-4" />
        </span>
        <h2 className="text-base font-semibold">Người dùng theo vai trò</h2>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{total.toLocaleString("vi-VN")}</p>
        <p className="mt-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Tổng tài khoản
        </p>
        <div className="mt-5 h-[238px] w-full sm:h-[260px] xl:h-[290px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} layout="vertical" margin={{ bottom: 0, left: -16, right: 8, top: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              {/* Trục hiện số nguyên thật. Bản cũ chia cho 1000 và thêm "k" vì dữ liệu giả
                  có hàng chục nghìn người; với số thật thì mọi vạch đều thành "0k". */}
              <XAxis
                allowDecimals={false}
                axisLine={false}
                fontSize={10}
                stroke="var(--muted-foreground)"
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="name"
                fontSize={11}
                stroke="var(--muted-foreground)"
                tickLine={false}
                type="category"
                width={72}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
                cursor={{ fill: "var(--muted)" }}
                formatter={(value) => [Number(value).toLocaleString("vi-VN"), "Tài khoản"]}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 border-t pt-4 text-center">
          {data.map((item) => (
            <div key={item.name}>
              <p className="text-sm font-semibold">{item.value.toLocaleString("vi-VN")}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
