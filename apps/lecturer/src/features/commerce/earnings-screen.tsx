"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Download, Wallet, RefreshCw, CircleHelp, Eye, Printer } from "lucide-react";
import { Button, Card, CourseCover, Modal, PageHeader, ServerPagination, StatStrip } from "@codementor/ui";
import {
  COMMERCE_INCOME_STATUS,
  COMMERCE_STATUS,
  type CommerceOrder,
  type CommercePage,
  type CommerceWithdrawal,
  type CommerceLedgerEntry,
  type WalletSummary,
} from "@codementor/types";
import { earningsApi, vnd } from "./api";
import { WithdrawalForm } from "./withdrawal-form";
import { downloadCsv, printDocument } from "@codementor/utils";
type Tab = "orders" | "withdrawals" | "ledger";
type Detail =
  | { type: "order"; item: CommerceOrder }
  | { type: "withdrawal"; item: CommerceWithdrawal }
  | { type: "ledger"; item: CommerceLedgerEntry };
export function EarningsScreen() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [help, setHelp] = useState(false);
  const [orders, setOrders] = useState<CommercePage<CommerceOrder> | null>(
    null,
  );
  const [withdrawals, setWithdrawals] =
    useState<CommercePage<CommerceWithdrawal> | null>(null);
  const [ledger, setLedger] =
    useState<CommercePage<CommerceLedgerEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await earningsApi.wallet();
      setWallet(summary);
      if (tab === "orders") setOrders(await earningsApi.orders(page, sort));
      if (tab === "withdrawals")
        setWithdrawals(await earningsApi.withdrawals(page, sort));
      if (tab === "ledger") setLedger(await earningsApi.ledger(page, sort));
      setError("");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [tab, page, sort]);
  useEffect(() => {
    void load();
  }, [load]);
  const current =
    tab === "orders" ? orders : tab === "withdrawals" ? withdrawals : ledger;
  function exportCurrent() {
    if (tab === "orders") {
      downloadCsv("doanh-thu-khoa-hoc.csv", ["Khóa học", "Học viên", "Email", "Ngày", "Giá bán", "Doanh thu", "Trạng thái"], (orders?.items ?? []).map((o) => [o.courseTitle, o.buyer?.name ?? "Học viên", o.buyer?.email ?? "", new Date(o.createdAt).toLocaleString("vi-VN"), o.amount, o.instructorAmount, COMMERCE_STATUS[o.status] ?? o.status]));
    } else if (tab === "withdrawals") {
      downloadCsv("yeu-cau-rut-tien.csv", ["Mã yêu cầu", "Ngày", "Số tiền", "Phương thức", "Tài khoản nhận", "Trạng thái"], (withdrawals?.items ?? []).map((w) => [w.id, new Date(w.createdAt).toLocaleString("vi-VN"), w.amount, w.recipient.method.toUpperCase(), `${w.recipient.institutionCode} · ****${w.recipient.accountNumber?.slice(-4)}`, COMMERCE_STATUS[w.status] ?? w.status]));
    } else {
      downloadCsv("bien-dong-so-du.csv", ["Ngày", "Sự kiện", "Loại số dư", "Biến động", "Mã tham chiếu"], (ledger?.items ?? []).map((e) => [new Date(e.createdAt).toLocaleString("vi-VN"), e.event.split(":")[0], COMMERCE_STATUS[e.account] ?? e.account, e.amount, e.orderId ?? e.withdrawalId ?? ""]));
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        icon={Wallet}
        title="Doanh thu"
        description="Theo dõi doanh thu khóa học, số dư và các yêu cầu rút tiền."
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => setHelp(true)}><CircleHelp className="size-4" /> Hướng dẫn</Button><Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="size-4" /> Làm mới</Button></div>}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {wallet && (
        <>
          <StatStrip
            stats={[
              ["pending", "Doanh thu đang chờ"],
              ["available", "Sẵn sàng rút"],
              ["reserved", "Đang xử lý rút"],
              ["paid", "Đã thanh toán"],
            ].map(([key, label]) => ({
              label,
              value: vnd(wallet.balances[key] ?? 0),
            }))}
          />
          <p className="text-sm text-muted-foreground">
            Bạn nhận {wallet.policy.instructorBps / 100}% trên mỗi đơn hàng.
            Doanh thu khả dụng sau {wallet.policy.holdDays} ngày để xử lý hoàn
            tiền hoặc khiếu nại phát sinh.
          </p>
          {(wallet.balances.refund_held > 0 || wallet.balances.debt < 0) && (
            <Card className="p-4 text-sm">
              Giữ để hoàn tiền: {vnd(wallet.balances.refund_held)} · Cần bù trừ
              từ thu nhập sau: {vnd(-wallet.balances.debt)}
            </Card>
          )}
          <WithdrawalForm wallet={wallet} refresh={load} />
        </>
      )}
      <Card>
        <div
          className="flex flex-wrap gap-2 border-b border-border p-3"
          role="tablist"
          aria-label="Lịch sử thu nhập"
        >
          {[
            ["orders", "Đơn hàng"],
            ["withdrawals", "Yêu cầu rút"],
            ["ledger", "Biến động số dư"],
          ].map(([key, label]) => (
            <Button
              key={key}
              role="tab"
              aria-selected={tab === key}
              variant={tab === key ? "default" : "outline"}
              onClick={() => {
                setTab(key as Tab);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
          <Button variant="outline" className="ml-auto" disabled={!current?.items.length} onClick={exportCurrent}>
            <Download className="size-4" /> Xuất CSV trang này
          </Button>
          <select aria-label="Sắp xếp dữ liệu" className="rounded-lg border bg-background px-3 text-sm" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="amount_high">Số tiền cao nhất</option><option value="amount_low">Số tiền thấp nhất</option></select>
        </div>
        {loading ? (
          <p
            className="p-8 text-center text-sm text-muted-foreground"
            role="status"
          >
            Đang tải…
          </p>
        ) : !current?.items.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu trong mục này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  {(tab === "orders"
                    ? [
                        "Khóa học",
                        "Học viên",
                        "Giá bán",
                        "Doanh thu của bạn",
                        "Trạng thái",
                        "Chi tiết",
                      ]
                    : tab === "withdrawals"
                      ? [
                          "Ngày / mã yêu cầu",
                          "Số tiền",
                          "Tài khoản nhận",
                          "Trạng thái",
                          "Chi tiết",
                        ]
                      : [
                          "Ngày / sự kiện",
                          "Loại số dư",
                          "Biến động",
                          "Mã tham chiếu",
                          "Chi tiết",
                        ]
                  ).map((h) => (
                    <th className="p-3 font-medium" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tab === "orders" &&
                  orders?.items.map((o) => (
                    <tr key={o.id}>
                      <td className="max-w-xs break-words p-3">
                        <div className="flex items-center gap-3"><CourseCover src={o.courseCoverImageUrl} title={o.courseTitle} className="size-11" /><div><p className="font-medium">{o.courseTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                        </p></div></div>
                      </td>
                      <td className="p-3"><p className="font-medium">{o.buyer?.name ?? "Học viên"}</p><p className="text-xs text-muted-foreground">{o.buyer?.email}</p></td>
                      <td className="whitespace-nowrap p-3">{vnd(o.amount)}</td>
                      <td className="whitespace-nowrap p-3">
                        {vnd(o.instructorAmount)} ({o.instructorBps / 100}%)
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{COMMERCE_STATUS[o.status] ?? o.status}</p>
                        <p className="text-xs text-muted-foreground">
                          Doanh thu: {COMMERCE_INCOME_STATUS[o.incomeState] ?? o.incomeState}
                          {o.availableAt &&
                            ` · dự kiến ${new Date(o.availableAt).toLocaleDateString("vi-VN")}`}
                        </p>
                      </td>
                      <td className="p-3"><Button variant="outline" onClick={() => setDetail({ type: "order", item: o })}><Eye className="size-4" /> Chi tiết</Button></td>
                    </tr>
                  ))}
                {tab === "withdrawals" &&
                  withdrawals?.items.map((w) => (
                    <tr key={w.id}>
                      <td className="p-3">
                        <p>{new Date(w.createdAt).toLocaleString("vi-VN")}</p>
                        <p className="max-w-48 break-all text-xs text-muted-foreground">
                          {w.id}
                        </p>
                      </td>
                      <td className="p-3">{vnd(w.amount)}</td>
                      <td className="p-3">
                        {w.recipient.label}
                        <p className="text-xs text-muted-foreground">
                          {w.recipient.institutionCode} · ••••{w.recipient.accountNumber?.slice(-4)}
                        </p>
                      </td>
                      <td className="p-3">
                        {COMMERCE_STATUS[w.status]}
                        <p className="text-xs text-muted-foreground">
                          {w.reason}
                        </p>
                      </td>
                      <td className="p-3"><Button variant="outline" onClick={() => setDetail({ type: "withdrawal", item: w })}><Eye className="size-4" /> Chi tiết</Button></td>
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
                      <td className="whitespace-nowrap p-3 font-medium">
                        {e.amount > 0 ? "+" : ""}
                        {vnd(e.amount)}
                      </td>
                      <td className="max-w-48 break-all p-3 text-xs text-muted-foreground">
                        {e.orderId ?? e.withdrawalId}
                      </td>
                      <td className="p-3"><Button variant="outline" onClick={() => setDetail({ type: "ledger", item: e })}><Eye className="size-4" /> Chi tiết</Button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <ServerPagination page={page} total={current?.total ?? 0} pageSize={current?.limit ?? 20} disabled={loading} onPageChange={setPage} />
      </Card>
      <Modal open={help} onClose={() => setHelp(false)} title="Hướng dẫn quản lý doanh thu"><div className="space-y-4 text-sm"><Guide number="1" title="Thiết lập nơi nhận tiền">Chọn ngân hàng, MoMo hoặc VNPAY; nhập đúng tên chủ tài khoản và số tài khoản.</Guide><Guide number="2" title="Theo dõi doanh thu">Khoản thu mới được giữ trong thời gian quy định trước khi chuyển sang số dư có thể rút.</Guide><Guide number="3" title="Tạo yêu cầu rút">Chọn số tiền, kiểm tra phương thức nhận và theo dõi trạng thái tại tab Yêu cầu rút.</Guide><Guide number="4" title="Đối chiếu dữ liệu">Mở Chi tiết hoặc xuất CSV để kiểm tra từng đơn hàng và biến động số dư.</Guide></div></Modal>
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.type === "order" ? "Chi tiết đơn hàng" : detail?.type === "withdrawal" ? "Chi tiết yêu cầu rút" : "Chi tiết biến động số dư"}>{detail && <DetailView detail={detail} />}</Modal>
    </div>
  );
}

function Guide({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <div className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-muted-foreground">{children}</p></div></div>; }
function DetailView({ detail }: { detail: Detail }) {
  if (detail.type === "order") { const item = detail.item; return <div className="space-y-4 text-sm"><div className="flex items-center gap-3"><CourseCover src={item.courseCoverImageUrl} title={item.courseTitle} className="size-16" /><div><h3 className="font-semibold">{item.courseTitle}</h3><p className="text-xs text-muted-foreground">#{item.id}</p></div></div><DetailRows rows={[["Học viên", `${item.buyer?.name ?? "Học viên"} · ${item.buyer?.email ?? ""}`], ["Ngày mua", new Date(item.createdAt).toLocaleString("vi-VN")], ["Giá bán", vnd(item.amount)], ["Doanh thu của bạn", `${vnd(item.instructorAmount)} (${item.instructorBps / 100}%)`], ["Trạng thái thanh toán", COMMERCE_STATUS[item.status] ?? item.status], ["Trạng thái doanh thu", COMMERCE_INCOME_STATUS[item.incomeState] ?? item.incomeState], ["Dự kiến khả dụng", item.availableAt ? new Date(item.availableAt).toLocaleString("vi-VN") : "Chưa xác định"], ["Mã đơn", item.id]]} title="Chứng từ doanh thu khóa học" /></div>; }
  if (detail.type === "withdrawal") { const item = detail.item; return <DetailRows title="Phiếu yêu cầu rút tiền" rows={[["Mã yêu cầu", item.id], ["Ngày tạo", new Date(item.createdAt).toLocaleString("vi-VN")], ["Số tiền", vnd(item.amount)], ["Phương thức", item.recipient.method.toUpperCase()], ["Nơi nhận", `${item.recipient.institutionCode} · ••••${item.recipient.accountNumber?.slice(-4)}`], ["Chủ tài khoản", item.recipient.accountName], ["Trạng thái", COMMERCE_STATUS[item.status] ?? item.status], ["Ghi chú", item.reason ?? "Không có"]]} />; }
  const item = detail.item;
  return <DetailRows title="Phiếu biến động số dư" rows={[["Mã biến động", item.id], ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")], ["Sự kiện", item.event.split(":")[0]], ["Loại số dư", COMMERCE_STATUS[item.account] ?? item.account], ["Giá trị", `${item.amount > 0 ? "+" : ""}${vnd(item.amount)}`], ["Tham chiếu", item.orderId ?? item.withdrawalId ?? "Không có"]]} />;
}
function DetailRows({ rows, title }: { rows: Array<[string, string]>; title: string }) {
  return <div className="space-y-4"><dl className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div className="rounded-lg border p-3" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl><div className="flex flex-wrap justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => downloadCsv("chi-tiet-giao-dich.csv", ["Thông tin", "Giá trị"], rows)}><Download className="size-4" /> Xuất CSV</Button><Button variant="outline" onClick={() => printDocument({ title, rows })}><Printer className="size-4" /> In / lưu PDF</Button></div></div>;
}
