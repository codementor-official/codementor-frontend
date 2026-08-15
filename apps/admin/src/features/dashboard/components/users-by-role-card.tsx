"use client";

import { UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usersByRoleData } from "@/features/dashboard/data/dashboard.mock";

export function UsersByRoleCard() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <span className="mr-3 flex size-8 items-center justify-center rounded-lg border bg-background">
          <UsersRound aria-hidden="true" className="size-4" />
        </span>
        <h2 className="text-base font-semibold">Users by Role</h2>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {usersByRoleData.map((item) => (
            <span className="flex items-center gap-1.5" key={item.name}>
              <span className="size-2 rounded-full" style={{ background: item.fill }} />{item.name}
            </span>
          ))}
        </div>
        <div className="mt-5 h-[238px] w-full sm:h-[260px] xl:h-[290px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={usersByRoleData} layout="vertical" margin={{ bottom: 0, left: -16, right: 8, top: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis axisLine={false} fontSize={10} stroke="var(--muted-foreground)" tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} type="number" />
              <YAxis axisLine={false} dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} type="category" width={72} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }}
                cursor={{ fill: "var(--muted)" }}
                formatter={(value) => [Number(value).toLocaleString(), "Users"]}
              />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 border-t pt-4 text-center">
          {usersByRoleData.map((item) => (
            <div key={item.name}>
              <p className="text-sm font-semibold">{item.value.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{item.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
