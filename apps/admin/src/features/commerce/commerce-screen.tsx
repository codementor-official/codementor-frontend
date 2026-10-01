"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CircleHelp, Download, Eye, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { Button, Card, CourseCover, Modal, PageHeader, ServerPagination, useToast } from "@codementor/ui";
import { inputClassName } from "./form-style";
import {
  COMMERCE_INCOME_STATUS,
  COMMERCE_STATUS,
  type CommerceOrder,
  type CommercePage,
  type CommerceWithdrawal,
  type CommerceLedgerEntry,
  type CommerceAudit,
  type CommercePolicy,
  type PurchaseDetail,
} from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi as api, vnd } from "./api";
import { PolicyForm } from "./policy-form";
import { OrderDialog } from "./order-dialog";
import { ReconciliationSummary } from "./reconciliation-summary";
import { downloadCsv } from "@codementor/utils";
type Tab = "orders" | "withdrawals" | "ledger" | "audit" | "policy";
type RecordDetail =
  | { type: "withdrawal"; item: CommerceWithdrawal }
  | { type: "ledger"; item: CommerceLedgerEntry }
  | { type: "audit"; item: CommerceAudit };
export function CommerceScreen() {
  const request = useAdminApi();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("orders");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [help, setHelp] = useState(false);
  const [recordDetail, setRecordDetail] = useState<RecordDetail | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orders, setOrders] = useState<CommercePage<CommerceOrder> | null>(
    null,
  );
  const [withdrawals, setWithdrawals] =
    useState<CommercePage<CommerceWithdrawal> | null>(null);
  const [ledger, setLedger] =
    useState<CommercePage<CommerceLedgerEntry> | null>(null);
  const [audit, setAudit] = useState<CommercePage<CommerceAudit> | null>(null);
  const [policy, setPolicy] = useState<CommercePolicy | null>(null);
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [decision, setDecision] = useState<{
    id: string;
    approve: boolean;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "orders") setOrders(await api.orders(request, page, orderStatus, orderQuery, sort));
      if (tab === "withdrawals")
        setWithdrawals(await api.withdrawals(request, page, sort));
      if (tab === "ledger") setLedger(await api.ledger(request, page, sort));
      if (tab === "audit") setAudit(await api.audit(request, page, sort));
      if (tab === "policy") setPolicy(await api.policy(request));
      setError("");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [request, tab, page, orderStatus, orderQuery, sort]);
  useEffect(() => {
    void load();
  }, [load]);
  async function command(path: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      await api.command(request, path, body);
      toast.info("Đã xử lý yêu cầu. Xem trạng thái do máy chủ xác nhận.");
      setDecision(null);
      if (detail) setDetail(await api.detail(request, detail.id));
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    setBusy(true);
    try {
      setDetail(await api.detail(request, id));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const current =
    tab === "orders"
      ? orders
      : tab === "withdrawals"
        ? withdrawals
        : tab === "ledger"
          ? ledger
          : tab === "audit"
            ? audit
            : null;
  function exportCurrent() {
    if (tab === "orders") downloadCsv("giao-dich-khoa-hoc.csv", ["Mã đơn", "Khóa học", "Người mua", "Email", "Ngày", "Giá bán", "Doanh thu giảng viên", "Doanh thu hệ thống", "Trạng thái"], (orders?.items ?? []).map((o) => [o.id, o.courseTitle, o.buyer?.name ?? "Học viên", o.buyer?.email ?? "", new Date(o.createdAt).toLocaleString("vi-VN"), o.amount, o.instructorAmount, o.platformAmount, COMMERCE_STATUS[o.status] ?? o.status]));
    if (tab === "withdrawals") downloadCsv("yeu-cau-rut-tien.csv", ["Mã yêu cầu", "Ngày", "Số tiền", "Phương thức", "Người nhận", "Tài khoản", "Trạng thái"], (withdrawals?.items ?? []).map((w) => [w.id, new Date(w.createdAt).toLocaleString("vi-VN"), w.amount, w.recipient.method.toUpperCase(), w.recipient.accountName, `${w.recipient.institutionCode} · ****${w.recipient.accountNumber?.slice(-4)}`, COMMERCE_STATUS[w.status] ?? w.status]));
    if (tab === "ledger") downloadCsv("bien-dong-so-du.csv", ["Ngày", "Sự kiện", "Tài khoản", "Biến động", "Mã tham chiếu"], (ledger?.items ?? []).map((e) => [new Date(e.createdAt).toLocaleString("vi-VN"), e.event.split(":")[0], COMMERCE_STATUS[e.account] ?? e.account, e.amount, e.orderId ?? e.withdrawalId ?? ""]));
    if (tab === "audit") downloadCsv("nhat-ky-giao-dich.csv", ["Thời điểm", "Thao tác", "Đối tượng", "Chi tiết"], (audit?.items ?? []).map((e) => [new Date(e.createdAt).toLocaleString("vi-VN"), e.action, e.entityId, JSON.stringify(e.details)]));
  }
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Wallet}
        title="Quản lý giao dịch"
        description="Theo dõi thanh toán khóa học, hoàn tiền, doanh thu và yêu cầu rút tiền."
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => setHelp(true)}><CircleHelp className="size-4" /> Hướng dẫn</Button><Button variant="outline" disabled={busy || loading} onClick={() => void load()}><RefreshCw className="size-4" /> Làm mới</Button></div>}
      />
      <ReconciliationSummary refreshing={loading || busy} />
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex max-w-3xl gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck className="size-5" /></span><div><p className="font-semibold">Đối soát giao dịch</p><p className="mt-1 text-xs text-muted-foreground">Kiểm tra trạng thái thanh toán, hoàn tiền và các khoản chi trả đang chờ xác nhận. Những mục cần xử lý sẽ được cập nhật vào các chỉ số phía trên.</p></div></div>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void command("jobs/run")}
        >
          Đối soát ngay
        </Button>
      </Card>
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Quản lý giao dịch"
      >
        {[
          ["orders", "Đơn hàng"],
          ["withdrawals", "Yêu cầu rút tiền"],
          ["ledger", "Biến động số dư"],
          ["audit", "Nhật ký hoạt động"],
          ["policy", "Chính sách doanh thu"],
        ].map(([v, l]) => (
          <Button
            key={v}
            role="tab"
            aria-selected={tab === v}
            variant={tab === v ? "default" : "outline"}
            onClick={() => {
              setTab(v as Tab);
              setPage(1);
              setSort("newest");
            }}
          >
            {l}
          </Button>
        ))}
        {tab !== 'policy' && (
          <Button
            className="ml-auto"
            variant="outline"
            disabled={!current?.items.length}
            onClick={exportCurrent}
          >
            <Download className="size-4" /> Xuất CSV
          </Button>
        )}
        {tab !== 'policy' && <select aria-label="Sắp xếp dữ liệu" className="rounded-lg border bg-background px-3 py-2 text-sm" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option>{tab !== "audit" && <><option value="amount_high">Số tiền cao nhất</option><option value="amount_low">Số tiền thấp nhất</option></>}</select>}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {tab === "orders" && <Card className="flex flex-wrap items-center gap-3 p-4">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setOrderQuery(orderSearch.trim()); }}>
          <input aria-label="Tìm đơn hàng" className="min-w-64 rounded-md border border-border bg-transparent px-3 py-2 text-sm" placeholder="Tên học viên, email hoặc khóa học" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
          <Button type="submit" variant="outline">Tìm</Button>
        </form>
        <select aria-label="Lọc trạng thái đơn" className="rounded-md border border-border bg-transparent px-3 py-2 text-sm" value={orderStatus} onChange={(e) => { setPage(1); setOrderStatus(e.target.value); }}><option value="">Mọi trạng thái</option>{["paid", "pending", "review", "failed", "cancelled", "refunded", "expired"].map((s) => <option key={s} value={s}>{COMMERCE_STATUS[s]}</option>)}</select>
        <span className="text-sm text-muted-foreground">{orders?.total ?? 0} đơn phù hợp</span>
      </Card>}
      {loading ? (
        <p
          role="status"
          className="p-8 text-center text-sm text-muted-foreground"
        >
          Đang tải…
        </p>
      ) : tab === "policy" ? (
        policy && (
          <PolicyForm
            key={JSON.stringify(policy)}
            initial={policy}
            save={async (p) => {
              const result = await api.setPolicy(request, p);
              setPolicy(result);
            }}
          />
        )
      ) : (
        <Card>
          {!current?.items.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    {(tab === "orders"
                      ? [
                          "Khóa học / đơn",
                          "Người mua",
                          "Học viên trả",
                          "Phân bổ / phí",
                          "Trạng thái",
                          "Thao tác",
                        ]
                      : tab === "withdrawals"
                        ? [
                            "Yêu cầu",
                            "Số tiền",
                            "Người nhận",
                            "Trạng thái",
                            "Thao tác",
                          ]
                        : tab === "ledger"
                          ? [
                              "Ngày / sự kiện",
                              "Tài khoản",
                              "Biến động",
                              "Liên kết",
                              "Thao tác",
                            ]
                          : ["Thời điểm", "Thao tác", "Đối tượng", "Chi tiết", "Xem"]
                    ).map((h) => (
                      <th className="p-3 font-medium" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tab === "orders" &&
                    orders?.items.map((o) => (
                      <tr key={o.id}>
                        <td className="max-w-xs p-3">
                          <div className="flex items-center gap-3"><CourseCover src={o.courseCoverImageUrl} title={o.courseTitle} className="size-11" /><div><p className="font-medium">{o.courseTitle}</p>
                          <p className="break-all text-xs text-muted-foreground">
                            {new Date(o.createdAt).toLocaleString("vi-VN")} · #{o.id.slice(0, 8)}
                          </p></div></div>
                        </td>
                        <td className="p-3"><p className="font-medium">{o.buyer?.name ?? "Học viên"}</p><p className="text-xs text-muted-foreground">{o.buyer?.email}</p></td>
                        <td className="whitespace-nowrap p-3">
                          {vnd(o.amount)}
                        </td>
                        <td className="p-3 text-xs">
                          GV: {vnd(o.instructorAmount)}
                          <br />
                          Hệ thống: {vnd(o.platformAmount)}
                          <br />
                          Phí:{" "}
                          {o.feeAmount === null
                            ? "Chưa xác định"
                            : `${vnd(o.feeAmount)} (${o.feeSource === "simulated" ? "Hệ thống" : "Cổng thanh toán"})`}
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{COMMERCE_STATUS[o.status] ?? o.status}</p>
                          <p className="text-xs text-muted-foreground">
                            Doanh thu: {COMMERCE_INCOME_STATUS[o.incomeState] ?? o.incomeState}
                          </p>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void open(o.id)}
                          >
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {tab === "withdrawals" &&
                    withdrawals?.items.map((w) => (
                      <tr key={w.id}>
                        <td className="max-w-48 break-all p-3 text-xs">
                          {w.id}
                          <p>{new Date(w.createdAt).toLocaleString("vi-VN")}</p>
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {vnd(w.amount)}
                        </td>
                        <td className="p-3">
                          {w.recipient.label}
                          <p className="text-xs text-muted-foreground">
                            {w.recipient.testReference}
                          </p>
                        </td>
                        <td className="p-3">
                          {COMMERCE_STATUS[w.status]}
                          <p className="text-xs text-muted-foreground">
                            {w.reason}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setRecordDetail({ type: "withdrawal", item: w })}><Eye className="size-4" /> Chi tiết</Button>
                            {w.status === "requested" ? (
                              <>
                                {[true, false].map((approve) => (
                                  <Button
                                    key={String(approve)}
                                    variant={approve ? "default" : "outline"}
                                    disabled={busy}
                                    onClick={() => {
                                      setDecision({ id: w.id, approve });
                                      setReason("");
                                    }}
                                  >
                                    {approve ? "Duyệt" : "Từ chối"}
                                  </Button>
                                ))}
                              </>
                            ) : ["processing", "pending", "unknown"].includes(
                                w.status,
                              ) ? (
                              ["success", "failure"].map((result) => (
                                <Button
                                  key={result}
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() =>
                                    void command(
                                      `withdrawals/${w.id}/mock-result`,
                                      { result },
                                    )
                                  }
                                >
                                  {result === "success"
                                    ? "Xác nhận đã chi trả"
                                    : "Ghi nhận chi trả thất bại"}
                                </Button>
                              ))
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {tab === "ledger" &&
                    ledger?.items.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3">
                          {new Date(e.createdAt).toLocaleString("vi-VN")}
                          <p className="text-xs text-muted-foreground">
                            {e.event.split(":")[0]}
                          </p>
                        </td>
                        <td className="p-3">
                          {COMMERCE_STATUS[e.account] ?? e.account}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {vnd(e.amount)}
                        </td>
                        <td className="max-w-56 break-all p-3 text-xs">
                          {e.orderId ?? e.withdrawalId}
                        </td>
                        <td className="p-3"><Button variant="outline" onClick={() => setRecordDetail({ type: "ledger", item: e })}><Eye className="size-4" /> Chi tiết</Button></td>
                      </tr>
                    ))}
                  {tab === "audit" &&
                    audit?.items.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3">
                          {new Date(e.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3">{e.action}</td>
                        <td className="max-w-48 break-all p-3 text-xs">
                          {e.entityId}
                        </td>
                        <td className="max-w-xs break-words p-3 text-xs">
                          {JSON.stringify(e.details)}
                        </td>
                        <td className="p-3"><Button variant="outline" onClick={() => setRecordDetail({ type: "audit", item: e })}><Eye className="size-4" /> Chi tiết</Button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <ServerPagination page={page} total={current?.total ?? 0} pageSize={current?.limit ?? 20} disabled={loading} onPageChange={setPage} />
        </Card>
      )}
      {detail && (
        <OrderDialog
          order={detail}
          close={() => setDetail(null)}
          command={command}
          busy={busy}
        />
      )}
      <Modal open={help} onClose={() => setHelp(false)} title="Hướng dẫn quản lý giao dịch"><div className="space-y-4 text-sm"><HelpStep number="1" title="Đơn hàng">Theo dõi tiền học viên thanh toán, phần chia cho giảng viên, phí và quyền học.</HelpStep><HelpStep number="2" title="Yêu cầu rút tiền">Kiểm tra thông tin người nhận trước khi duyệt; lý do là bắt buộc khi duyệt hoặc từ chối.</HelpStep><HelpStep number="3" title="Đối soát">Dùng Đối soát ngay để cập nhật các thanh toán, hoàn tiền và khoản chi đang chờ xác nhận.</HelpStep><HelpStep number="4" title="Báo cáo">Mở chi tiết từng bản ghi hoặc xuất CSV theo tab để kiểm tra và lưu trữ.</HelpStep></div></Modal>
      <Modal open={!!recordDetail} onClose={() => setRecordDetail(null)} title={recordDetail?.type === "withdrawal" ? "Chi tiết yêu cầu rút" : recordDetail?.type === "ledger" ? "Chi tiết biến động số dư" : "Chi tiết nhật ký hoạt động"}>{recordDetail && <AdminRecordDetail detail={recordDetail} />}</Modal>
      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision?.approve ? "Duyệt yêu cầu rút" : "Từ chối yêu cầu rút"}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {decision?.approve
              ? "Yêu cầu sẽ chuyển sang hàng đợi chi trả. Trạng thái chỉ hoàn tất khi hệ thống xác nhận kết quả."
              : "Tiền đang giữ sẽ được trả về số dư khả dụng đúng một lần."}
          </p>
          <label className="block text-sm">
            Ghi chú / lý do
            <textarea
              className={`${inputClassName} mt-1 min-h-20`}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button
            disabled={busy || reason.trim().length < 5}
            onClick={() =>
              decision &&
              void command(`withdrawals/${decision.id}/decide`, {
                approve: decision.approve,
                reason,
              })
            }
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function HelpStep({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <div className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-muted-foreground">{children}</p></div></div>; }
function AdminRecordDetail({ detail }: { detail: RecordDetail }) {
  if (detail.type === "withdrawal") { const item = detail.item; return <AdminRows rows={[["Mã yêu cầu", item.id], ["Ngày tạo", new Date(item.createdAt).toLocaleString("vi-VN")], ["Số tiền", vnd(item.amount)], ["Phương thức", item.recipient.method.toUpperCase()], ["Nơi nhận", `${item.recipient.institutionCode} · ••••${item.recipient.accountNumber?.slice(-4)}`], ["Chủ tài khoản", item.recipient.accountName], ["Trạng thái", COMMERCE_STATUS[item.status] ?? item.status], ["Lý do / ghi chú", item.reason ?? "Không có"]]} />; }
  if (detail.type === "ledger") { const item = detail.item; return <AdminRows rows={[["Mã biến động", item.id], ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")], ["Sự kiện", item.event.split(":")[0]], ["Tài khoản", COMMERCE_STATUS[item.account] ?? item.account], ["Giá trị", `${item.amount > 0 ? "+" : ""}${vnd(item.amount)}`], ["Tham chiếu", item.orderId ?? item.withdrawalId ?? "Không có"]]} />; }
  const item = detail.item;
  return <div className="space-y-4"><AdminRows rows={[["Mã nhật ký", item.id], ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")], ["Thao tác", item.action], ["Đối tượng", item.entityId ?? "Không có"]]} /><div className="rounded-lg border bg-muted/30 p-3"><p className="mb-2 text-xs text-muted-foreground">Dữ liệu chi tiết</p><pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(item.details, null, 2)}</pre></div></div>;
}
function AdminRows({ rows }: { rows: Array<[string, string]> }) { return <dl className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div className="rounded-lg border p-3" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>; }
