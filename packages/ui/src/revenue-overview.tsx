"use client";
import { useState } from "react";
import type { RevenueReport } from "@codementor/types";
import { COMMERCE_STATUS } from "@codementor/types";
import { Button } from "./button";
import { Card } from "./card";
import { DailyBarCard } from "./daily-bar-card";
import { ServerPagination } from "./server-pagination";

const money = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const dateLabel = (value: string) => value.split("-").reverse().join("/");
const moneyTick = (value: number) => {
  const unit = Math.abs(value) >= 1_000_000_000 ? [1_000_000_000, "tỷ"] as const
    : Math.abs(value) >= 1_000_000 ? [1_000_000, "triệu"] as const
      : Math.abs(value) >= 1_000 ? [1_000, "nghìn"] as const : [1, ""] as const;
  return `${(value / unit[0]).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${unit[1]}`.trim();
};

/** Shared presentation only: callers own fetching, authorization and exports. */
export function RevenueOverview({ report, days, onDaysChange, onExport, loading }: {
  report: RevenueReport | null; days: number; onDaysChange: (days: number) => void;
  onExport: () => void; loading: boolean;
}) {
  const [metric, setMetric] = useState<"revenue" | "gross" | "orders">("revenue");
  const [courseSort, setCourseSort] = useState("revenue");
  const [coursePage, setCoursePage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);
  const shareLabel = report?.scope === "admin" ? "Phần thu hệ thống" : "Doanh thu của bạn";
  const courses = [...(report?.courses ?? [])].sort((a, b) => courseSort === "orders" ? b.orders - a.orders : b.revenue - a.revenue);
  const activeCoursePage = Math.min(coursePage, Math.max(1, Math.ceil(courses.length / 10)));
  const activeDailyPage = Math.min(dailyPage, Math.max(1, Math.ceil((report?.daily.length ?? 0) / 10)));
  return <section className="space-y-4" aria-label="Tổng quan doanh thu" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-base font-semibold">Tổng quan doanh thu</h2><p className="mt-1 text-xs text-muted-foreground">{report ? `${dateLabel(report.from)} – ${dateLabel(report.to)} · Giờ Việt Nam` : "Thống kê theo thời gian"}</p></div>
      <div className="flex flex-wrap gap-2"><select aria-label="Khoảng thời gian báo cáo" className="rounded-md border bg-background px-3 py-2 text-sm" value={days} onChange={(e) => onDaysChange(Number(e.target.value))}><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select><Button variant="outline" disabled={loading || !report} onClick={onExport}>Xuất báo cáo CSV</Button></div>
    </div>
    {loading ? <p role="status" className="p-6 text-center text-sm text-muted-foreground">Đang tổng hợp báo cáo…</p> : !report ? <p className="text-sm text-muted-foreground">Chưa tải được báo cáo. Bấm Làm mới để thử lại.</p> : <>
      <Card className="p-4">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Giá trị đơn đã thanh toán", money(report.totals.gross)], [shareLabel, money(report.totals.revenue)], ["Đã hoàn tiền", money(report.totals.refunded)], ["Đơn đã thanh toán / hoàn tiền", report.totals.paidOrders.toLocaleString("vi-VN")]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd></div>)}
        </dl>
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Đơn thanh toán được tính theo ngày xác nhận. Phần thu dùng tỷ lệ đã lưu của từng đơn, loại trừ đơn đã hoàn tiền; chưa trừ phí cổng thanh toán. Đây không phải số dư có thể rút. Hoàn tiền thuộc các đơn trong kỳ, không phải dòng tiền hoàn trả phát sinh trong kỳ.</p>
      </Card>
      <div className="space-y-4">
        <div className="min-w-0 space-y-3">
          <label className="flex flex-wrap items-center justify-end gap-2 text-sm">Biểu đồ<select aria-label="Chỉ số biểu đồ" className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm" value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)}><option value="revenue">{shareLabel} (VND)</option><option value="gross">Giá trị đơn thanh toán (VND)</option><option value="orders">Số đơn thanh toán</option></select></label>
          <DailyBarCard title={`${metric === "orders" ? "Số đơn thanh toán" : metric === "gross" ? "Giá trị đơn thanh toán (VND)" : `${shareLabel} (VND)`} theo ngày`} data={report.daily} value={metric} formatTick={metric === "orders" ? undefined : moneyTick} describe={(point) => `${point.orders} đơn · Giá trị ${money(point.gross)} · Phần thu ${money(point.revenue)} · Hoàn ${money(point.refunded)}`} />
          <details className="overflow-hidden rounded-lg border bg-card"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">Số liệu từng ngày · {report.daily.length} ngày</summary><div className="overflow-x-auto"><table className="w-full min-w-[560px] table-fixed text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Ngày</th><th className="px-4 py-3 text-right">Số đơn</th><th className="px-4 py-3 text-right">Giá trị đơn</th><th className="px-4 py-3 text-right">{shareLabel}</th></tr></thead><tbody className="divide-y">{report.daily.slice((activeDailyPage - 1) * 10, activeDailyPage * 10).map((p) => <tr key={p.date}><td className="px-4 py-3">{dateLabel(p.date)}</td><td className="px-4 py-3 text-right tabular-nums">{p.orders}</td><td className="px-4 py-3 text-right tabular-nums">{money(p.gross)}</td><td className="px-4 py-3 text-right tabular-nums">{money(p.revenue)}</td></tr>)}</tbody></table></div><ServerPagination page={activeDailyPage} total={report.daily.length} pageSize={10} onPageChange={setDailyPage} /></details>
        </div>
        <Card className="overflow-hidden"><div className="border-b px-4 py-3"><h3 className="text-sm font-semibold">Trạng thái đơn trong kỳ</h3><p className="mt-1 text-xs text-muted-foreground">Đơn chưa thanh toán tính theo ngày tạo, không cộng vào doanh thu.</p></div><dl className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">{Object.entries(report.statuses).map(([status, count]) => <div key={status} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><dt className="text-muted-foreground">{COMMERCE_STATUS[status] ?? status}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl>{!Object.keys(report.statuses).length && <p className="p-4 text-sm text-muted-foreground">Chưa có đơn trong kỳ này.</p>}</Card>
      </div>
      <Card className="min-w-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h3 className="text-sm font-semibold">Khóa học tạo doanh thu</h3><p className="mt-1 text-xs text-muted-foreground">{courses.length} khóa học trong kỳ · Toàn bộ danh sách, 10 khóa học mỗi trang.</p></div><select aria-label="Sắp xếp khóa học trong báo cáo" className="rounded-md border bg-background px-3 py-2 text-sm" value={courseSort} onChange={(e) => { setCourseSort(e.target.value); setCoursePage(1); }}><option value="revenue">Phần thu cao nhất</option><option value="orders">Nhiều đơn nhất</option></select></div>
        {courses.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] table-fixed text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="w-1/2 px-4 py-3">Khóa học</th><th className="px-4 py-3 text-right">Số đơn</th><th className="px-4 py-3 text-right">{shareLabel}</th></tr></thead><tbody className="divide-y">{courses.slice((activeCoursePage - 1) * 10, activeCoursePage * 10).map((c) => <tr key={c.id}><td className="px-4 py-3 font-medium"><p className="truncate" title={c.title}>{c.title}</p></td><td className="px-4 py-3 text-right tabular-nums">{c.orders}</td><td className="px-4 py-3 text-right tabular-nums">{money(c.revenue)}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-muted-foreground">Chưa có thanh toán trong khoảng thời gian này.</p>}
        <ServerPagination page={activeCoursePage} total={courses.length} pageSize={10} onPageChange={setCoursePage} />
      </Card>
    </>}
  </section>;
}
