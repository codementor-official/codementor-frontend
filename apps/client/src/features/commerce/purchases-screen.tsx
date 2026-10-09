"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Printer,
  Receipt,
  RefreshCw,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  COMMERCE_STATUS,
  type CommercePage,
  type CommerceOrder,
  type PurchaseDetail,
} from "@codementor/types";
import { CourseCover, FieldError, fieldA11y, Modal, ServerPagination, useToast } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { commerceApi, vnd } from "./api";
import { downloadCsv, printDocument, search as searchRule } from "@codementor/utils";

function paymentLabel(provider: string): string {
  if (provider === "mock") return "Thanh toán trực tuyến";
  return provider.toUpperCase();
}

function statusTone(status: string): string {
  if (status === "paid") return "bg-success/10 text-success";
  if (["failed", "cancelled", "expired"].includes(status))
    return "bg-danger/10 text-danger";
  if (status === "refunded") return "bg-warning/10 text-warning";
  return "bg-border-soft text-navy";
}

function orderCode(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function PurchasesScreen({ orderId }: { orderId?: string }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  // `CommercePage.q` 1–100; trống = không lọc.
  const searchError = searchRule(search, 100);
  const [list, setList] = useState<CommercePage<CommerceOrder> | null>(null);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [quickDetail, setQuickDetail] = useState<PurchaseDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = useCallback(async () => {
    try {
      if (orderId) setDetail(await commerceApi.detail(orderId));
      else setList(await commerceApi.orders(page, status, query, sort));
      setError("");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId, page, status, query, sort]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!orderId || !detail || !["pending", "review"].includes(detail.status))
      return;
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [orderId, detail, load]);
  async function action(result?: string) {
    if (!orderId) return;
    setBusy(true);
    try {
      const d = result
        ? await commerceApi.mock(orderId, result)
        : await commerceApi.reconcile(orderId);
      setDetail(d);
      toast.info(
        d.status === "paid"
          ? "Đã thanh toán. Quyền học đã được cấp."
          : "Đã cập nhật trạng thái từ máy chủ.",
      );
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function openQuickDetail(id: string) {
    setBusy(true);
    try { setQuickDetail(await commerceApi.detail(id)); }
    catch (e) { toast.error(apiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        icon={Receipt}
        title={orderId ? "Chi tiết đơn hàng" : "Khóa học đã mua"}
        subtitle={
          orderId
            ? "Thông tin thanh toán và quyền truy cập khóa học của bạn."
            : "Theo dõi các khóa học đã mua và trạng thái thanh toán."
        }
      />
      {orderId && <Link href="/purchases" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"><ArrowLeft className="size-4" /> Danh sách đơn hàng</Link>}
      {loading && (
        <p role="status" className="text-sm text-text-muted">
          Đang tải giao dịch…
        </p>
      )}
      {error && (
        <Card className="p-4">
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
          <Button variant="outline" onClick={() => void load()}>
            Thử lại
          </Button>
        </Card>
      )}
      {detail && (
        <Card className="overflow-hidden shadow-sm" id="purchase-invoice">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-6 p-5 sm:p-6 lg:border-r lg:border-border-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <CourseCover src={detail.courseCoverImageUrl} title={detail.courseTitle} className="size-14" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Khóa học</p>
                    <h2 className="mt-1 text-xl font-bold leading-snug text-navy">{detail.courseTitle}</h2>
                    <p className="mt-1 text-xs text-text-muted">Đơn hàng #{orderCode(detail.id)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusTone(detail.status)}`}>
                  {COMMERCE_STATUS[detail.status] ?? detail.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InvoiceMeta icon={CalendarDays} label="Ngày đặt" value={new Date(detail.createdAt).toLocaleString("vi-VN")} />
                <InvoiceMeta icon={CreditCard} label="Phương thức" value={paymentLabel(detail.payment.provider)} />
                <InvoiceMeta icon={CheckCircle2} label="Thanh toán" value={COMMERCE_STATUS[detail.payment.status] ?? detail.payment.status} />
              </div>

              <div className="rounded-xl border border-border-soft bg-border-soft/20 p-4">
                <h3 className="font-semibold text-navy">Trạng thái quyền học</h3>
                <p className="mt-1 text-sm leading-6 text-text-muted">
                  {detail.status === "paid"
                    ? "Thanh toán đã được xác nhận và khóa học đã được mở cho tài khoản của bạn."
                    : detail.status === "pending"
                      ? `Đơn đang chờ xác nhận. Vui lòng hoàn tất trước ${new Date(detail.expiresAt).toLocaleString("vi-VN")}.`
                      : detail.status === "review"
                        ? "Giao dịch đang được kiểm tra. Bạn sẽ nhận thông báo khi có kết quả."
                        : detail.status === "refunded"
                          ? "Khoản thanh toán đã được hoàn lại và quyền học từ đơn này đã thu hồi."
                          : "Đơn hàng chưa cấp quyền học. Bạn có thể quay lại khóa học để thực hiện giao dịch mới."}
                </p>
                {detail.refund && (
                  <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-navy">
                    Hoàn tiền: {COMMERCE_STATUS[detail.refund.status]} · {detail.refund.reason}
                  </p>
                )}
              </div>

              <div className="purchase-actions flex flex-wrap gap-2">
                {detail.status === "paid" ? (
                  <Button href={`/courses/${detail.courseId}`}><BookOpen className="size-4" /> Vào học ngay</Button>
                ) : detail.status === "pending" && detail.payment.provider === "mock" ? (
                  <>
                    <Button disabled={busy} onClick={() => void action("success")}>Hoàn tất thanh toán</Button>
                    <Button disabled={busy} onClick={() => void action("cancelled")} variant="outline">Hủy đơn hàng</Button>
                  </>
                ) : detail.status === "pending" && detail.payment.checkoutUrl ? (
                  <Button href={detail.payment.checkoutUrl}>Tiếp tục thanh toán</Button>
                ) : (
                  <Button href={`/courses/${detail.courseId}`} variant="outline">Xem khóa học</Button>
                )}
                <Button variant="outline" onClick={() => printDocument({ title: "Chứng từ mua khóa học", rows: purchaseDocumentRows(detail) })}><Printer className="size-4" /> In / lưu PDF</Button>
                <Button disabled={busy} onClick={() => void action()} variant="outline">
                  <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Cập nhật trạng thái
                </Button>
              </div>
            </section>

            <aside className="space-y-5 bg-border-soft/15 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Tóm tắt thanh toán</p>
                <p className="mt-2 text-3xl font-bold text-navy">{vnd(detail.amount)}</p>
              </div>
              <dl className="space-y-3 border-y border-border-soft py-4 text-sm">
                <InvoiceRow label="Giá tại thời điểm mua" value={vnd(detail.pricingSnapshot?.originalPriceVnd ?? detail.amount)} />
                {detail.pricingSnapshot && <InvoiceRow label={detail.pricingSnapshot.promotion?.label ?? "Giảm giá"} value={`−${vnd(detail.pricingSnapshot.discountVnd)}`} />}
                <InvoiceRow label="Phí bổ sung" value={vnd(0)} />
                <InvoiceRow emphasize label="Tổng cộng" value={vnd(detail.amount)} />
              </dl>
              <div className="space-y-1.5 text-xs text-text-muted">
                <p className="font-medium text-navy">Thông tin đơn hàng</p>
                <p className="break-all">Mã đầy đủ: {detail.id}</p>
                <p>Mã tiền tệ: {detail.currency}</p>
                {detail.settledAt && <p>Xác nhận lúc: {new Date(detail.settledAt).toLocaleString("vi-VN")}</p>}
              </div>
            </aside>
          </div>
        </Card>
      )}
      {!orderId && (
        <Card className="overflow-hidden shadow-sm">
          <div className="space-y-4 border-b border-border-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-navy">Lịch sử giao dịch</h2>
                <p className="mt-0.5 text-sm text-text-muted">
                  {list ? `${list.total} đơn hàng${status || query ? " phù hợp với bộ lọc" : ""}` : "Đang tải danh sách"}
                </p>
              </div>
              <Button
                className="shrink-0 whitespace-nowrap"
                variant="outline"
                disabled={!list?.items.length}
                onClick={() => list && downloadCsv(
                  `don-hang-khoa-hoc-${new Date().toISOString().slice(0, 10)}.csv`,
                  ["Mã đơn", "Khóa học", "Ngày mua", "Số tiền", "Trạng thái"],
                  list.items.map((order) => [order.id, order.courseTitle, new Date(order.createdAt).toLocaleString("vi-VN"), order.amount, COMMERCE_STATUS[order.status] ?? order.status]),
                )}
              >
                <Download className="size-4" /> Xuất CSV trang này
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px_190px]">
              <form className="flex min-w-0 items-center gap-2 rounded-lg border border-border-soft bg-background px-3 focus-within:border-primary" onSubmit={(e) => { e.preventDefault(); if (searchError) return; setPage(1); setQuery(search.trim()); }}>
                <Search className="size-4 text-text-muted" />
                <input {...fieldA11y("purchase-search", searchError)} aria-label="Tìm khóa học" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên khóa học" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm" />
                <button className="border-l border-border-soft py-1 pl-3 text-sm font-semibold text-primary hover:underline" type="submit">
                  Tìm
                </button>
              </form>
              <select aria-label="Lọc trạng thái" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-navy">
                <option value="">Mọi trạng thái</option>
                {["paid", "pending", "failed", "cancelled", "review", "refunded", "expired"].map((s) => <option key={s} value={s}>{COMMERCE_STATUS[s]}</option>)}
              </select>
              <select aria-label="Sắp xếp đơn hàng" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-navy"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="amount_high">Giá cao nhất</option><option value="amount_low">Giá thấp nhất</option></select>
            </div>
            <FieldError className="mt-2" error={searchError} htmlFor="purchase-search" />
          </div>
          {list && (
          !list.items.length ? (
            <p className="p-8 text-center text-sm text-text-muted">
              {status || query ? "Không tìm thấy đơn hàng phù hợp. Hãy thử bộ lọc khác." : "Bạn chưa mua khóa học nào."}
            </p>
          ) : (
            <>
            <ul className="divide-y divide-border-soft md:hidden">{list.items.map((o) => <li key={o.id} className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <CourseCover src={o.courseCoverImageUrl} title={o.courseTitle} className="size-12" />
                <div className="min-w-0"><p className="font-semibold leading-5 text-navy">{o.courseTitle}</p><p className="mt-1 text-xs text-text-muted">#{orderCode(o.id)} · {new Date(o.createdAt).toLocaleDateString("vi-VN")}</p></div>
              </div>
              <div className="flex items-center justify-between gap-2"><span className="text-lg font-bold text-navy">{vnd(o.amount)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(o.status)}`}>{COMMERCE_STATUS[o.status] ?? o.status}</span></div>
              <button disabled={busy} onClick={() => void openQuickDetail(o.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Xem chi tiết đơn hàng <ArrowUpRight className="size-4" /></button>
            </li>)}</ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] table-fixed text-left text-sm">
                <colgroup><col className="w-[36%]" /><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[16%]" /><col className="w-[14%]" /></colgroup>
                <thead className="bg-border-soft/45 text-xs uppercase tracking-wide text-text-muted"><tr><th className="px-5 py-3.5 font-semibold">Khóa học / mã đơn</th><th className="px-4 py-3.5 font-semibold">Thời gian</th><th className="px-4 py-3.5 font-semibold">Thanh toán</th><th className="px-4 py-3.5 font-semibold">Trạng thái</th><th className="px-5 py-3.5 text-right font-semibold">Thao tác</th></tr></thead><tbody className="divide-y divide-border-soft">
              {list.items.map((o) => (
                <tr key={o.id} className="group transition-colors hover:bg-border-soft/25">
                  <td className="px-5 py-4"><div className="flex min-w-0 items-center gap-3"><CourseCover src={o.courseCoverImageUrl} title={o.courseTitle} className="size-11" /><div className="min-w-0"><span className="block truncate font-semibold text-navy" title={o.courseTitle}>{o.courseTitle}</span><span className="mt-0.5 block text-xs text-text-muted">#{orderCode(o.id)}</span></div></div></td>
                  <td className="whitespace-nowrap px-4 py-4"><p className="font-medium text-navy">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p><p className="mt-0.5 text-xs text-text-muted">{new Date(o.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p></td>
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-navy">{vnd(o.amount)}</td>
                  <td className="px-4 py-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(o.status)}`}>{COMMERCE_STATUS[o.status] ?? o.status}</span></td>
                  <td className="px-5 py-4 text-right"><button disabled={busy} onClick={() => void openQuickDetail(o.id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-border-soft px-3 py-2 font-semibold text-navy transition-colors group-hover:border-primary group-hover:text-primary">Chi tiết <ArrowUpRight className="size-3.5" /></button></td>
                </tr>
              ))}
            </tbody></table></div>
            </>
          ))}
          {list && (
          <ServerPagination page={page} total={list.total} pageSize={list.limit} disabled={loading || busy} onPageChange={setPage} />
          )}
        </Card>
      )}
      <Modal open={!!quickDetail} onClose={() => setQuickDetail(null)} title="Chi tiết đơn hàng" width="lg">{quickDetail && <div className="space-y-5 text-sm"><div className="flex items-start gap-4"><CourseCover src={quickDetail.courseCoverImageUrl} title={quickDetail.courseTitle} className="size-20" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Khóa học</p><h3 className="mt-1 text-lg font-bold text-navy">{quickDetail.courseTitle}</h3><p className="mt-1 break-all text-xs text-text-muted">Đơn hàng #{orderCode(quickDetail.id)}</p></div></div><dl className="grid gap-3 sm:grid-cols-2"><QuickRow label="Ngày mua" value={new Date(quickDetail.createdAt).toLocaleString("vi-VN")} /><QuickRow label="Số tiền" value={vnd(quickDetail.amount)} /><QuickRow label="Phương thức" value={paymentLabel(quickDetail.payment.provider)} /><QuickRow label="Trạng thái" value={COMMERCE_STATUS[quickDetail.status] ?? quickDetail.status} /></dl><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> In / lưu PDF</Button><Button href={`/purchases/${quickDetail.id}`}>Mở chi tiết đầy đủ</Button>{quickDetail.status === "paid" && <Button href={`/courses/${quickDetail.courseId}`} variant="outline">Vào học</Button>}</div></div>}</Modal>
    </div>
  );
}

function InvoiceMeta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft p-3.5">
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-navy">{value}</p>
    </div>
  );
}

function InvoiceRow({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${emphasize ? "pt-2 text-base font-bold text-navy" : "text-text-muted"}`}>
      <dt>{label}</dt>
      <dd className={emphasize ? "" : "font-medium text-navy"}>{value}</dd>
    </div>
  );
}

function QuickRow({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border-soft p-3"><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-1 font-semibold text-navy">{value}</dd></div>; }

function purchaseDocumentRows(order: PurchaseDetail): Array<[string, string]> {
  return [
    ["Mã đơn", order.id], ["Khóa học", order.courseTitle],
    ["Người mua", order.buyer?.name ?? "Học viên"], ["Email", order.buyer?.email ?? ""],
    ["Ngày mua", new Date(order.createdAt).toLocaleString("vi-VN")],
    ["Tổng thanh toán", vnd(order.amount)],
    ...(order.pricingSnapshot ? [
      ["Giá gốc tại thời điểm mua", vnd(order.pricingSnapshot.originalPriceVnd)],
      ["Giảm giá", vnd(order.pricingSnapshot.discountVnd)],
      ["Khuyến mãi", order.pricingSnapshot.promotion?.label ?? "Không có"],
      ["Phiên bản giá", String(order.pricingSnapshot.priceVersion)],
    ] as Array<[string, string]> : []),
    ["Trạng thái", COMMERCE_STATUS[order.status] ?? order.status],
    ["Phương thức", paymentLabel(order.payment.provider)],
    ["Xác nhận thanh toán", order.settledAt ? new Date(order.settledAt).toLocaleString("vi-VN") : "Chưa xác nhận"],
    ...(order.refund ? [["Hoàn tiền", COMMERCE_STATUS[order.refund.status] ?? order.refund.status], ["Lý do hoàn tiền", order.refund.reason]] as Array<[string, string]> : []),
  ];
}
