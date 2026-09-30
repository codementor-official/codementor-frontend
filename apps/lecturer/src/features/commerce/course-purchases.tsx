"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card } from "@codementor/ui";
import { COMMERCE_STATUS, type CoursePurchasePage } from "@codementor/types";
import { downloadCsv } from "@codementor/utils";
import { Download } from "lucide-react";
import { earningsApi, vnd } from "./api";

export function CoursePurchases({ courseId }: { courseId: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<CoursePurchasePage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await earningsApi.courseOrders(courseId, page, status, query));
      setError("");
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [courseId, page, status, query]);
  useEffect(() => { void load(); }, [load]);

  return <Card className="overflow-hidden">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-4">
      <div><h2 className="font-semibold">Học viên đã mua</h2><p className="text-sm text-muted-foreground">{data?.total ?? 0} giao dịch{status || query ? " phù hợp bộ lọc" : ""}. Quyền học chỉ được cấp sau khi thanh toán thành công.</p></div>
      <div className="flex gap-2"><Button variant="outline" disabled={!data?.items.length} onClick={() => downloadCsv("hoc-vien-da-mua.csv", ["Học viên", "Email", "Ngày mua", "Giá khóa học", "Doanh thu giảng viên", "Trạng thái"], (data?.items ?? []).map((o) => [o.buyer?.name ?? "Học viên", o.buyer?.email ?? "", new Date(o.createdAt).toLocaleString("vi-VN"), o.amount, o.instructorAmount, COMMERCE_STATUS[o.status] ?? o.status]))}><Download className="size-4" /> Xuất CSV</Button><Button variant="outline" disabled={loading} onClick={() => void load()}>Làm mới</Button></div>
    </div>
    {data && <dl className="grid gap-3 border-b border-border p-4 text-sm sm:grid-cols-3">
      <div><dt className="text-muted-foreground">Đã thanh toán</dt><dd className="mt-1 text-lg font-semibold">{data.summary.paidCount} học viên</dd></div>
      <div><dt className="text-muted-foreground">Doanh số khóa học</dt><dd className="mt-1 text-lg font-semibold">{vnd(data.summary.grossAmount)}</dd></div>
      <div><dt className="text-muted-foreground">Phần giảng viên</dt><dd className="mt-1 text-lg font-semibold">{vnd(data.summary.instructorAmount)}</dd></div>
    </dl>}
    <div className="flex flex-wrap gap-2 border-b border-border p-4">
      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
        <input aria-label="Tìm học viên" className="min-w-56 rounded-md border border-border bg-transparent px-3 py-2 text-sm" placeholder="Tên hoặc email học viên" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Tìm</Button>
      </form>
      <select aria-label="Lọc giao dịch" className="rounded-md border border-border bg-transparent px-3 py-2 text-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
        <option value="">Mọi trạng thái</option>
        {["paid", "pending", "failed", "cancelled", "review", "refunded"].map((s) => <option key={s} value={s}>{COMMERCE_STATUS[s]}</option>)}
      </select>
    </div>
    {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
    {loading ? <p role="status" className="p-8 text-center text-sm text-muted-foreground">Đang tải giao dịch…</p> : !data?.items.length ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch phù hợp.</p> :
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3 font-medium">Học viên</th><th className="p-3 font-medium">Ngày mua</th><th className="p-3 font-medium">Giá khóa học</th><th className="p-3 font-medium">Doanh thu giảng viên</th><th className="p-3 font-medium">Trạng thái</th></tr></thead><tbody className="divide-y divide-border">{data.items.map((o) => <tr key={o.id}><td className="p-3"><p className="font-medium">{o.buyer?.name ?? "Học viên"}</p><p className="text-xs text-muted-foreground">{o.buyer?.email}</p></td><td className="whitespace-nowrap p-3">{new Date(o.createdAt).toLocaleString("vi-VN")}</td><td className="whitespace-nowrap p-3">{vnd(o.amount)}</td><td className="whitespace-nowrap p-3">{vnd(o.instructorAmount)}</td><td className="p-3">{COMMERCE_STATUS[o.status] ?? o.status}</td></tr>)}</tbody></table></div>}
    <div className="flex items-center justify-between border-t border-border p-3 text-sm"><Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Trước</Button><span>Trang {page} / {Math.max(1, Math.ceil((data?.total ?? 0) / 20))}</span><Button variant="outline" disabled={loading || page * 20 >= (data?.total ?? 0)} onClick={() => setPage(page + 1)}>Sau</Button></div>
  </Card>;
}
