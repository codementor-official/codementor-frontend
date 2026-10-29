"use client";

import type { ReactNode } from "react";
import { AlarmClock, BadgeDollarSign, CreditCard, Hourglass, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, InfoHint } from "@codementor/ui";
import { formatVnd } from "@codementor/utils";
import type { SubscriberStats, SubscriptionState } from "@codementor/types";
import { STATE } from "./subscribers-tab";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const TOOLTIP = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
  cursor: { fill: "var(--muted)" },
};
const AXIS = { axisLine: false, tickLine: false, fontSize: 11, stroke: "var(--muted-foreground)" } as const;
const STATE_ORDER: SubscriptionState[] = ["ACTIVE", "CANCEL_SCHEDULED", "GRACE_PERIOD", "SUSPENDED", "EXPIRED", "CANCELLED"];
const WEEK_LABEL = ["7 ngày tới", "8–14 ngày", "15–21 ngày", "22–30 ngày"];
const compactVnd = (v: number) => (v >= 1e6 ? `${(v / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : `${Math.round(v / 1e3)}k`);

/**
 * Charts above the subscriber table. Clicking a plan or a state filters the table below, so the
 * picture and the list stay one action apart.
 */
export function SubscriberStatsPanel({
  stats,
  onFilter,
}: {
  stats: SubscriberStats | null;
  onFilter: (filter: { planId?: string; state?: SubscriptionState }) => void;
}) {
  if (!stats)
    return (
      <div className="grid gap-3 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => <Card key={i} className="h-64 animate-pulse" />)}
      </div>
    );

  const count = (s: SubscriptionState) => stats.byState.find((r) => r.state === s)?.count ?? 0;
  const paying = count("ACTIVE") + count("CANCEL_SCHEDULED");
  const monthlyValue = stats.byPlan.reduce((sum, p) => sum + p.monthlyValueVnd, 0);
  const expiring = stats.expiringByWeek.reduce((sum, w) => sum + w.count, 0);
  const over = stats.overLimitOwners;
  const states = STATE_ORDER.map((s) => ({ state: s, name: STATE[s].label, value: count(s) })).filter((r) => r.value > 0);
  const months = stats.monthly.map((m) => ({ ...m, label: `T${Number(m.month.slice(5))}/${m.month.slice(2, 4)}` }));
  const yearly = stats.byCycle.find((c) => c.cycle === "year")?.count ?? 0;
  const cycleTotal = stats.byCycle.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile icon={CreditCard} label="Đang trả phí" value={paying.toLocaleString("vi-VN")} note={`${yearly}/${cycleTotal} trả theo năm`} />
        <Tile icon={BadgeDollarSign} label="Giá trị hợp đồng / tháng" value={formatVnd(monthlyValue)} note="Gói năm tính 1/12; không phải doanh thu chắc chắn" />
        <Tile icon={Hourglass} label="Đang ân hạn" value={count("GRACE_PERIOD").toLocaleString("vi-VN")} note="Hết kỳ, chưa gia hạn" onClick={() => onFilter({ state: "GRACE_PERIOD" })} />
        <Tile icon={AlarmClock} label="Đến hạn trong 30 ngày" value={expiring.toLocaleString("vi-VN")} note={formatVnd(stats.expiringByWeek.reduce((s, w) => s + w.valueVnd, 0))} />
        <Tile
          icon={ShieldAlert}
          label="Chủ nhóm vượt hạn mức"
          value={(over.notice + over.readOnly + over.hidden).toLocaleString("vi-VN")}
          note={`${over.notice} cảnh báo · ${over.readOnly} chỉ đọc · ${over.hidden} tạm ẩn`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="Đăng ký và doanh thu 6 tháng" hint="Cột: đơn mua mới/nâng cấp và gia hạn đã thanh toán. Đường: tiền thu trong tháng (giờ Việt Nam)." className="lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={months} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis yAxisId="n" allowDecimals={false} {...AXIS} />
              <YAxis yAxisId="vnd" orientation="right" tickFormatter={compactVnd} {...AXIS} width={48} />
              <Tooltip
                {...TOOLTIP}
                formatter={(v, name) => [name === "Doanh thu" ? formatVnd(Number(v)) : Number(v).toLocaleString("vi-VN"), name]}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="n" dataKey="newSubscriptions" name="Mua mới / nâng cấp" stackId="n" fill="var(--chart-1)" barSize={22} />
              <Bar yAxisId="n" dataKey="renewals" name="Gia hạn" stackId="n" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={22} />
              <Line yAxisId="vnd" dataKey="revenueVnd" name="Doanh thu" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cơ cấu theo gói" hint="Gói đang có hiệu lực (kể cả ân hạn). Bấm vào một gói để lọc bảng.">
          {stats.byPlan.length === 0 ? (
            <Empty>Chưa có người trả phí.</Empty>
          ) : (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byPlan} dataKey="count" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none"
                      onClick={(_d, i) => onFilter({ planId: stats.byPlan[i].planId })} className="cursor-pointer">
                      {stats.byPlan.map((p, i) => <Cell key={p.planId} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP} formatter={(v, name) => [`${v} người`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {stats.byPlan.map((p, i) => (
                  <li key={p.planId}>
                    <button type="button" className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-muted" onClick={() => onFilter({ planId: p.planId })}>
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span>{p.count}</span>
                      <span className="w-24 text-right text-muted-foreground">{formatVnd(p.monthlyValueVnd)}/th</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="Theo trạng thái" hint="Bấm vào một trạng thái để lọc bảng." height="h-52">
          {states.length === 0 ? (
            <Empty>Chưa có gói nào.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={states} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} {...AXIS} />
                <YAxis type="category" dataKey="name" width={108} {...AXIS} />
                <Tooltip {...TOOLTIP} formatter={(v) => [`${v} người`, "Số lượng"]} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={14} className="cursor-pointer"
                  onClick={(_d, i) => onFilter({ state: states[i].state })} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Sắp đến hạn gia hạn" hint="Gói đang hoạt động có kỳ đã trả kết thúc trong 30 ngày tới. Không gia hạn tự động." height="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.expiringByWeek.map((w) => ({ ...w, name: WEEK_LABEL[w.week] }))} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" {...AXIS} fontSize={10} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip {...TOOLTIP} formatter={(v, _n, item) => [`${v} gói · ${formatVnd((item.payload as { valueVnd: number }).valueVnd)}`, "Đến hạn"]} />
              <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Chủ nhóm vượt hạn mức" hint="Tính cả tài khoản Free. Cảnh báo → chỉ đọc → tạm ẩn với thành viên; dữ liệu không bị xoá." height="h-52">
          <ul className="flex h-full flex-col justify-center gap-3 text-sm">
            {[
              { label: "Đang cảnh báo", value: over.notice, tone: "bg-chart-3" },
              { label: "Nhóm chỉ đọc", value: over.readOnly, tone: "bg-chart-4" },
              { label: "Nhóm tạm ẩn", value: over.hidden, tone: "bg-destructive" },
            ].map((s) => {
              const total = Math.max(1, over.notice + over.readOnly + over.hidden);
              return (
                <li key={s.label}>
                  <div className="mb-1 flex justify-between"><span>{s.label}</span><span className="font-semibold">{s.value}</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${s.tone}`} style={{ width: `${(s.value / total) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, note, onClick }: { icon: typeof CreditCard; label: string; value: string; note: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" aria-hidden />{label}</span>
      <span className="mt-1 block text-xl font-semibold tracking-tight">{value}</span>
      <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={note}>{note}</span>
    </>
  );
  return (
    <Card className="p-3">
      {onClick ? <button type="button" className="w-full text-left" onClick={onClick}>{body}</button> : body}
    </Card>
  );
}

function ChartCard({ title, hint, children, className = "", height = "h-64" }: { title: string; hint: string; children: ReactNode; className?: string; height?: string }) {
  return (
    <Card className={`min-w-0 p-4 ${className}`}>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">{title}<InfoHint text={hint} /></h3>
      <div className={height}>{children}</div>
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{children}</p>;
}
