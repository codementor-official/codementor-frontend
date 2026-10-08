"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CircleHelp,
  Download,
  Eye,
  Printer,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  Button,
  Card,
  CourseCover,
  Modal,
  PageHeader,
  ServerPagination,
  useToast,
} from "@codementor/ui";
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
  type CommerceJobRun,
  type PurchaseDetail,
} from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { commerceAdminApi as api, vnd } from "./api";
import { PolicyForm } from "./policy-form";
import { JobResultDialog } from "./job-result-dialog";
import { OrderDialog } from "./order-dialog";
import { ReconciliationSummary } from "./reconciliation-summary";
import { downloadCsv, printDocument } from "@codementor/utils";
type Tab = "orders" | "withdrawals" | "ledger" | "audit" | "policy";
type RecordDetail =
  | { type: "withdrawal"; item: CommerceWithdrawal }
  | { type: "ledger"; item: CommerceLedgerEntry }
  | { type: "audit"; item: CommerceAudit };
export function CommerceScreen() {
  const request = useAdminApi();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("orders");
  const [runConfirmation, setRunConfirmation] = useState(false);
  const [lastRun, setLastRun] = useState<CommerceJobRun | null>(null);
  const [showRunResult, setShowRunResult] = useState(false);
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
      if (tab === "orders")
        setOrders(
          await api.orders(request, page, orderStatus, orderQuery, sort),
        );
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
  async function runJobs() {
    if (busy) return;
    setBusy(true);
    setRunConfirmation(false);
    try {
      const result = await api.runJobs(request);
      setLastRun(result);
      setShowRunResult(true);
      if (result.status === "already_running")
        toast.info("Đã có lượt đang chạy; không tạo thêm tác vụ.");
      else if (result.status === "partial")
        toast.info("Một số tác vụ cần kiểm tra. Xem báo cáo kết quả.");
      else
        toast.success(
          "Đã nhận báo cáo đối soát. Xem số liệu và giao dịch còn chờ.",
        );
      await load();
    } catch (e) {
      toast.error(
        `${apiErrorMessage(e)} Chưa xác nhận được kết quả lượt này. Làm mới dữ liệu/nhật ký trước khi thử lại; không bấm liên tục.`,
      );
    } finally {
      setBusy(false);
    }
  }
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
    if (tab === "orders")
      downloadCsv(
        "giao-dich-khoa-hoc.csv",
        [
          "Mã đơn",
          "Khóa học",
          "Người mua",
          "Email",
          "Ngày",
          "Giá bán",
          "Doanh thu giảng viên",
          "Doanh thu hệ thống",
          "Trạng thái",
        ],
        (orders?.items ?? []).map((o) => [
          o.id,
          o.courseTitle,
          o.buyer?.name ?? "Học viên",
          o.buyer?.email ?? "",
          new Date(o.createdAt).toLocaleString("vi-VN"),
          o.amount,
          o.instructorAmount,
          o.platformAmount,
          COMMERCE_STATUS[o.status] ?? o.status,
        ]),
      );
    if (tab === "withdrawals")
      downloadCsv(
        "yeu-cau-rut-tien.csv",
        [
          "Mã yêu cầu",
          "Ngày",
          "Số tiền",
          "Phương thức",
          "Người nhận",
          "Tài khoản",
          "Trạng thái",
        ],
        (withdrawals?.items ?? []).map((w) => [
          w.id,
          new Date(w.createdAt).toLocaleString("vi-VN"),
          w.amount,
          w.recipient.method.toUpperCase(),
          w.recipient.accountName,
          `${w.recipient.institutionCode} · ****${w.recipient.accountNumber?.slice(-4)}`,
          COMMERCE_STATUS[w.status] ?? w.status,
        ]),
      );
    if (tab === "ledger")
      downloadCsv(
        "bien-dong-so-du.csv",
        ["Ngày", "Sự kiện", "Tài khoản", "Biến động", "Mã tham chiếu"],
        (ledger?.items ?? []).map((e) => [
          new Date(e.createdAt).toLocaleString("vi-VN"),
          e.event.split(":")[0],
          COMMERCE_STATUS[e.account] ?? e.account,
          e.amount,
          e.orderId ?? e.withdrawalId ?? "",
        ]),
      );
    if (tab === "audit")
      downloadCsv(
        "nhat-ky-giao-dich.csv",
        ["Thời điểm", "Thao tác", "Đối tượng", "Chi tiết"],
        (audit?.items ?? []).map((e) => [
          new Date(e.createdAt).toLocaleString("vi-VN"),
          e.action,
          e.entityId,
          JSON.stringify(e.details),
        ]),
      );
  }
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        icon={Wallet}
        title="Quản lý giao dịch"
        description="Theo dõi thanh toán khóa học, hoàn tiền, doanh thu và yêu cầu rút tiền."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHelp(true)}>
              <CircleHelp className="size-4" /> Hướng dẫn
            </Button>
            <Button
              variant="outline"
              disabled={busy || loading}
              onClick={() => void load()}
            >
              <RefreshCw className="size-4" /> Làm mới
            </Button>
          </div>
        }
      />
      <ReconciliationSummary refreshing={loading || busy} />
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex max-w-3xl gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Đối soát & xử lý tài chính</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Xác minh giao dịch theo lô, mở doanh thu đủ điều kiện và xử lý yêu
              cầu rút đã được duyệt. Không bỏ qua thời gian giữ doanh thu. Xem
              Hướng dẫn trước khi thực hiện.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {lastRun && (
            <Button variant="outline" onClick={() => setShowRunResult(true)}>
              Kết quả lượt gần nhất
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setTab("policy");
              setPage(1);
            }}
          >
            Cấu hình thời gian giữ
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setRunConfirmation(true)}
          >
            {busy ? "Đang xử lý…" : "Đối soát ngay"}
          </Button>
        </div>
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
        {tab !== "policy" && (
          <Button
            className="ml-auto"
            variant="outline"
            disabled={!current?.items.length}
            onClick={exportCurrent}
          >
            <Download className="size-4" /> Xuất CSV trang này
          </Button>
        )}
        {tab !== "policy" && (
          <select
            aria-label="Sắp xếp dữ liệu"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            {tab !== "audit" && (
              <>
                <option value="amount_high">Số tiền cao nhất</option>
                <option value="amount_low">Số tiền thấp nhất</option>
              </>
            )}
          </select>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {tab === "orders" && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setOrderQuery(orderSearch.trim());
            }}
          >
            <input
              aria-label="Tìm đơn hàng"
              className="min-w-64 rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Tên học viên, email hoặc khóa học"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Tìm
            </Button>
          </form>
          <select
            aria-label="Lọc trạng thái đơn"
            className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            value={orderStatus}
            onChange={(e) => {
              setPage(1);
              setOrderStatus(e.target.value);
            }}
          >
            <option value="">Mọi trạng thái</option>
            {[
              "paid",
              "pending",
              "review",
              "failed",
              "cancelled",
              "refunded",
              "expired",
            ].map((s) => (
              <option key={s} value={s}>
                {COMMERCE_STATUS[s]}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {orders?.total ?? 0} đơn phù hợp
          </span>
        </Card>
      )}
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
        <Card className="min-w-0 overflow-hidden">
          {!current?.items.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-fixed text-left text-sm">
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
                          : [
                              "Thời điểm",
                              "Thao tác",
                              "Đối tượng",
                              "Chi tiết",
                              "Xem",
                            ]
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
                          <div className="flex items-center gap-3">
                            <CourseCover
                              src={o.courseCoverImageUrl}
                              title={o.courseTitle}
                              className="size-11"
                            />
                            <div>
                              <p className="font-medium">{o.courseTitle}</p>
                              <p className="break-all text-xs text-muted-foreground">
                                {new Date(o.createdAt).toLocaleString("vi-VN")}{" "}
                                · #{o.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">
                            {o.buyer?.name ?? "Học viên"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.buyer?.email}
                          </p>
                        </td>
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
                          <p className="font-medium">
                            {COMMERCE_STATUS[o.status] ?? o.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Doanh thu:{" "}
                            {COMMERCE_INCOME_STATUS[o.incomeState] ??
                              o.incomeState}
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
                            <Button
                              variant="outline"
                              onClick={() =>
                                setRecordDetail({ type: "withdrawal", item: w })
                              }
                            >
                              <Eye className="size-4" /> Chi tiết
                            </Button>
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
                        <td className="p-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setRecordDetail({ type: "ledger", item: e })
                            }
                          >
                            <Eye className="size-4" /> Chi tiết
                          </Button>
                        </td>
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
                        <td className="p-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setRecordDetail({ type: "audit", item: e })
                            }
                          >
                            <Eye className="size-4" /> Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <ServerPagination
            page={page}
            total={current?.total ?? 0}
            pageSize={current?.limit ?? 20}
            disabled={loading}
            onPageChange={setPage}
          />
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
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="Hướng dẫn quản lý giao dịch"
      >
        <div className="space-y-4 text-sm">
          <HelpStep number="1" title="Đọc đúng các số liệu">
            Tổng quan doanh thu dùng ngày xác nhận thanh toán và tỷ lệ chia đã
            lưu trên từng đơn. Phần thu hệ thống chưa trừ phí cổng thanh toán;
            phí chưa xác định không được coi là 0. Số liệu theo kỳ không phải số
            dư ngân hàng.
          </HelpStep>
          <HelpStep number="2" title="Đối soát không phải duyệt tất cả đơn">
            Máy chủ chọn giao dịch cần xác minh, tối đa 20 thanh toán mỗi lượt.
            Giao dịch VNPAY đã tra soát cần chờ ít nhất 6 phút trước lần tiếp
            theo. Đơn đã xác minh không bị thu tiền lại; giao dịch chưa rõ kết
            quả vẫn chờ kiểm tra, không được ép thành công.
          </HelpStep>
          <HelpStep number="3" title="Khi nào giảng viên được rút?">
            Thanh toán thành công → doanh thu đang chờ → hết thời gian giữ của
            đơn và đủ điều kiện xác minh → số dư khả dụng. Bấm đối soát không
            rút ngắn thời gian giữ. Xem ngày dự kiến trong chi tiết đơn và chính
            sách áp dụng; đơn cũ giữ tỷ lệ và thời gian đã lưu.
          </HelpStep>
          <HelpStep number="4" title="Các tác vụ đi kèm">
            Nút Đối soát ngay còn kiểm tra hoàn tiền đang chờ, đánh dấu đơn hết
            hạn, mở doanh thu đủ điều kiện và xử lý chi trả đã được duyệt. Không
            tự duyệt yêu cầu rút mới. Kiểm tra hàng đợi Yêu cầu rút trước khi
            chạy.
          </HelpStep>
          <HelpStep number="5" title="Đọc báo cáo sau mỗi lượt">
            Báo cáo tự mở sau khi máy chủ phản hồi: số được chọn, đã xác nhận,
            còn chờ, lỗi và số tiền thực sự mở sang khả dụng. Đã xác nhận có thể
            là kết quả thất bại, không đồng nghĩa đã thanh toán. Nếu số dư không
            tăng, xem các lý do còn chờ. Có thể mở lại Kết quả lượt gần nhất
            hoặc xuất CSV; nhật ký lưu các thay đổi thực tế.
          </HelpStep>
          <HelpStep number="7" title="Cấu hình thời gian giữ">
            Vào Chính sách doanh thu để chọn Ngày hoặc Phút (tối đa 90 ngày).
            Khi demo, chọn Phút và nhập 1 trước khi tạo đơn mới; thanh toán đã
            xác minh và hết phút, chạy đối soát để mở số dư nếu đủ điều kiện.
            Chính sách áp dụng toàn hệ thống, hãy khôi phục sau buổi demo. Thời gian được
            lưu trên đơn lúc tạo; mốc khả dụng tính từ lúc xác nhận thanh toán.
            Đổi chính sách không đổi đơn cũ, không bỏ qua xác minh/hoàn tiền và
            không lập tức mở toàn bộ số dư.
          </HelpStep>
          <HelpStep number="6" title="Báo cáo & chứng từ">
            Mở Doanh thu hệ thống trên thanh điều hướng để xem toàn hệ thống
            hoặc từng giảng viên, chọn 7/30/90 ngày và xuất báo cáo toàn kỳ. CSV
            tại bảng lịch sử chỉ xuất trang đang xem. Mở Chi tiết để in/lưu PDF
            chứng từ; chứng từ giao dịch không thay thế hóa đơn thuế.
          </HelpStep>
        </div>
      </Modal>
      <Modal
        open={runConfirmation}
        onClose={() => setRunConfirmation(false)}
        title="Xác nhận đối soát & xử lý tài chính"
      >
        <div className="space-y-4 text-sm">
          <p>
            Hệ thống sẽ xác minh giao dịch cần xử lý, mở doanh thu đã đủ điều
            kiện và xử lý yêu cầu chi trả đã được duyệt. Không tự duyệt yêu cầu
            mới hoặc bỏ qua thời gian giữ doanh thu.
          </p>
          <p className="text-muted-foreground">
            Báo cáo kết quả sẽ tự mở sau khi hoàn tất. Giao dịch chưa đến lượt
            tra soát vẫn được giữ lại.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setRunConfirmation(false)}
            >
              Hủy
            </Button>
            <Button disabled={busy} onClick={() => void runJobs()}>
              Xác nhận thực hiện
            </Button>
          </div>
        </div>
      </Modal>
      <JobResultDialog
        result={showRunResult ? lastRun : null}
        close={() => setShowRunResult(false)}
        policy={() => {
          setShowRunResult(false);
          setTab("policy");
          setPage(1);
        }}
      />
      <Modal
        open={!!recordDetail}
        onClose={() => setRecordDetail(null)}
        title={
          recordDetail?.type === "withdrawal"
            ? "Chi tiết yêu cầu rút"
            : recordDetail?.type === "ledger"
              ? "Chi tiết biến động số dư"
              : "Chi tiết nhật ký hoạt động"
        }
      >
        {recordDetail && <AdminRecordDetail detail={recordDetail} />}
      </Modal>
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

function HelpStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {number}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
function AdminRecordDetail({ detail }: { detail: RecordDetail }) {
  if (detail.type === "withdrawal") {
    const item = detail.item;
    return (
      <AdminRows
        title="Phiếu yêu cầu rút tiền"
        rows={[
          ["Mã yêu cầu", item.id],
          ["Ngày tạo", new Date(item.createdAt).toLocaleString("vi-VN")],
          ["Số tiền", vnd(item.amount)],
          ["Phương thức", item.recipient.method.toUpperCase()],
          [
            "Nơi nhận",
            `${item.recipient.institutionCode} · ••••${item.recipient.accountNumber?.slice(-4)}`,
          ],
          ["Chủ tài khoản", item.recipient.accountName],
          ["Trạng thái", COMMERCE_STATUS[item.status] ?? item.status],
          ["Lý do / ghi chú", item.reason ?? "Không có"],
        ]}
      />
    );
  }
  if (detail.type === "ledger") {
    const item = detail.item;
    return (
      <AdminRows
        title="Phiếu biến động số dư"
        rows={[
          ["Mã biến động", item.id],
          ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")],
          ["Sự kiện", item.event.split(":")[0]],
          ["Tài khoản", COMMERCE_STATUS[item.account] ?? item.account],
          ["Giá trị", `${item.amount > 0 ? "+" : ""}${vnd(item.amount)}`],
          ["Tham chiếu", item.orderId ?? item.withdrawalId ?? "Không có"],
        ]}
      />
    );
  }
  const item = detail.item;
  return (
    <div className="space-y-4">
      <AdminRows
        title="Nhật ký giao dịch"
        rows={[
          ["Mã nhật ký", item.id],
          ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")],
          ["Thao tác", item.action],
          ["Đối tượng", item.entityId ?? "Không có"],
          ["Nội dung", JSON.stringify(item.details, null, 2)],
        ]}
      />
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="mb-2 text-xs text-muted-foreground">Dữ liệu chi tiết</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
          {JSON.stringify(item.details, null, 2)}
        </pre>
      </div>
    </div>
  );
}
function AdminRows({
  rows,
  title,
}: {
  rows: Array<[string, string]>;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div className="rounded-lg border p-3" key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              "chi-tiet-giao-dich.csv",
              ["Thông tin", "Giá trị"],
              rows,
            )
          }
        >
          <Download className="size-4" /> Xuất CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => printDocument({ title, rows })}
        >
          <Printer className="size-4" /> In / lưu PDF
        </Button>
      </div>
    </div>
  );
}
