"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiErrorMessage } from "@codementor/api-client";
import type { RevenueInstructor, RevenueReport } from "@codementor/types";
import { Button, Card, Modal, PageHeader, RevenueOverview, ServerPagination } from "@codementor/ui";
import { ChartNoAxesCombined, CircleHelp, Download, RefreshCw } from "lucide-react";
import { downloadCsv, printDocument } from "@codementor/utils";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi as api, vnd } from "./api";

export function RevenueScreen() {
  const request = useAdminApi();
  const [days, setDays] = useState(30);
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<RevenueInstructor[]>([]);
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [help, setHelp] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("revenue");
  const [page, setPage] = useState(1);
  const scopeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (instructorId) scopeRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [instructorId]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReport(null);
    setError("");
    Promise.all([api.analytics(request, days, instructorId), api.revenueInstructors(request, days)])
      .then(([nextReport, nextInstructors]) => { if (active) { setReport(nextReport); setInstructors(nextInstructors); } })
      .catch((e) => { if (active) { setError(apiErrorMessage(e)); setInstructors([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, days, instructorId, refresh]);
  const selected = instructors.find((i) => i.id === instructorId);
  const rows = useMemo(() => instructors.filter((i) => `${i.name} ${i.email}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi")))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "vi") : b[sort as "revenue" | "available" | "orders"] - a[sort as "revenue" | "available" | "orders"] || a.id.localeCompare(b.id)), [instructors, query, sort]);
  const balances = selected ? [selected] : instructors;
  const total = (key: "pending" | "available" | "reserved" | "paid") => balances.reduce((sum, i) => sum + i[key], 0);
  const instructorCsv = () => downloadCsv("doanh-thu-giang-vien.csv", ["Giảng viên", "Email", "Số đơn trong kỳ", "Giá trị đơn", "Doanh thu giảng viên trong kỳ", "Phần thu hệ thống trong kỳ", "Đang chờ (toàn thời gian)", "Khả dụng (toàn thời gian)", "Đang giữ để rút", "Đã chi trả"], rows.map((i) => [i.name, i.email, i.orders, i.gross, i.revenue, i.platformRevenue, i.pending, i.available, i.reserved, i.paid]));
  return <div className="min-w-0 space-y-4">
    <PageHeader icon={ChartNoAxesCombined} title="Doanh thu hệ thống" description="Báo cáo thanh toán, phân bổ doanh thu và số dư giảng viên — tách biệt với tác vụ xử lý giao dịch." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setHelp(true)}><CircleHelp className="size-4" /> Hướng dẫn</Button><Button variant="outline" disabled={loading} onClick={() => setRefresh((v) => v + 1)}><RefreshCw className="size-4" /> Làm mới</Button></div>} />
    <div ref={scopeRef}><Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <label className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-sm font-medium">Phạm vi báo cáo<select aria-label="Chọn giảng viên báo cáo" className="min-w-0 w-full rounded-md border bg-background px-3 py-2 sm:w-80" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}><option value="">Toàn hệ thống</option>{instructors.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.email}</option>)}</select></label>
      <Link href="/commerce" className="text-sm font-medium text-primary hover:underline">Quản lý giao dịch & đối soát →</Link>
    </Card></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}
    {selected && !loading && <Card className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{selected.name}</h2><p className="break-all text-xs text-muted-foreground">{selected.email}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Doanh thu giảng viên trong kỳ, trước phí</p><p className="text-lg font-semibold tabular-nums">{vnd(selected.revenue)}</p></div></div></Card>}
    <RevenueOverview report={report} days={days} onDaysChange={setDays} loading={loading} onExport={() => report && downloadCsv("bao-cao-doanh-thu-he-thong.csv", ["Phạm vi", "Ngày", "Số đơn", "Giá trị đơn", "Phần thu hệ thống trước phí", "Hoàn tiền"], report.daily.map((d) => [selected?.email ?? "Toàn hệ thống", d.date, d.orders, d.gross, d.revenue, d.refunded]))} />
    {!loading && !error && <Card className="overflow-hidden"><div className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Số dư {selected ? "giảng viên đã chọn" : "giảng viên toàn hệ thống"}</h2><p className="mt-1 text-xs text-muted-foreground">Số dư sổ cái tại thời điểm tải, không giới hạn theo kỳ báo cáo và không phải số dư ngân hàng.</p></div><dl className="grid grid-cols-2 divide-x xl:grid-cols-4">{[["Đang chờ khả dụng", "pending"], ["Có thể yêu cầu rút", "available"], ["Đang giữ để rút", "reserved"], ["Đã chi trả", "paid"]].map(([label, key]) => <div key={key} className="p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-base font-semibold tabular-nums">{vnd(total(key as "pending"))}</dd></div>)}</dl></Card>}
    {!loading && !error && <Card className="min-w-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="text-sm font-semibold">Doanh thu theo giảng viên</h2><p className="mt-1 text-xs text-muted-foreground">{rows.length} giảng viên · Chọn Xem báo cáo để mở số liệu khóa học và biểu đồ tương ứng.</p></div><Button variant="outline" disabled={!rows.length} onClick={instructorCsv}><Download className="size-4" /> Xuất CSV danh sách</Button></div>
      <div className="flex flex-wrap gap-3 border-b p-4"><input aria-label="Tìm giảng viên báo cáo" placeholder="Tên hoặc email giảng viên" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /><select aria-label="Sắp xếp giảng viên" className="rounded-md border bg-background px-3 py-2 text-sm" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="revenue">Doanh thu cao nhất</option><option value="available">Khả dụng cao nhất</option><option value="orders">Nhiều đơn nhất</option><option value="name">Tên A–Z</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] table-fixed text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="w-1/3 px-4 py-3">Giảng viên</th><th className="px-4 py-3 text-right">Số đơn</th><th className="px-4 py-3 text-right">Thu giảng viên</th><th className="px-4 py-3 text-right">Thu hệ thống</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{rows.slice((page - 1) * 10, page * 10).map((i) => <tr key={i.id} className={instructorId === i.id ? "bg-primary/5" : "hover:bg-muted/30"}><td className="px-4 py-3"><p className="truncate font-medium" title={i.name}>{i.name}</p><p className="truncate text-xs text-muted-foreground" title={i.email}>{i.email}</p></td><td className="px-4 py-3 text-right tabular-nums">{i.orders}</td><td className="px-4 py-3 text-right tabular-nums">{vnd(i.revenue)}</td><td className="px-4 py-3 text-right tabular-nums">{vnd(i.platformRevenue)}</td><td className="px-4 py-3 text-right"><Button variant="outline" onClick={() => { setInstructorId(i.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Xem báo cáo</Button></td></tr>)}</tbody></table></div>{!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">Không có giảng viên phù hợp.</p>}<ServerPagination page={page} total={rows.length} pageSize={10} onPageChange={setPage} />
    </Card>}
    <Modal open={help} onClose={() => setHelp(false)} title="Hướng dẫn báo cáo doanh thu"><div className="space-y-4 text-sm"><p>Chọn Toàn hệ thống hoặc một giảng viên, sau đó chọn 7/30/90 ngày. Số liệu thanh toán dựa trên ngày xác nhận và tỷ lệ phân bổ đã lưu của mỗi đơn; không dùng tỷ lệ chính sách mới để tính lại đơn cũ.</p><p>Phần thu hệ thống và doanh thu giảng viên chưa trừ phí cổng thanh toán. Đơn đã hoàn tiền không cộng vào phần thu. Số dư phía dưới là số dư sổ cái toàn thời gian, không phụ thuộc bộ lọc ngày.</p><p>CSV biểu đồ xuất toàn kỳ; CSV giảng viên xuất toàn bộ danh sách đang lọc, không chỉ trang đang xem. Báo cáo này không phải hóa đơn thuế. Đối soát và duyệt rút tiền nằm trong Giao dịch.</p><Button variant="outline" disabled={!report} onClick={() => report && printDocument({ title: "Báo cáo doanh thu", rows: [["Phạm vi", selected?.name ?? "Toàn hệ thống"], ["Kỳ", `${report.from} – ${report.to}`], ["Giá trị đơn", vnd(report.totals.gross)], ["Phần thu hệ thống trước phí", vnd(report.totals.revenue)], ["Hoàn tiền", vnd(report.totals.refunded)]] })}>In / lưu PDF báo cáo</Button></div></Modal>
  </div>;
}
