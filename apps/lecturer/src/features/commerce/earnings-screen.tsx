"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Download,
  Wallet,
  RefreshCw,
  CircleHelp,
  Eye,
  Printer,
} from "lucide-react";
import {
  Button,
  Card,
  CourseCover,
  Modal,
  PageHeader,
  RevenueOverview,
  SegmentedTabs,
  ServerPagination,
  StatStrip,
} from "@codementor/ui";
import {
  COMMERCE_INCOME_STATUS,
  COMMERCE_STATUS,
  type CommerceOrder,
  type CommercePage,
  type CommerceWithdrawal,
  type CommerceLedgerEntry,
  type WalletSummary,
  type RevenueReport,
  type RevenueDateRange,
} from "@codementor/types";
import { earningsApi, vnd } from "./api";
import { WithdrawalForm } from "./withdrawal-form";
import { LecturerRevenueBalances } from "./revenue-balances";
import {
  HoldingExplanation,
  OrderHoldingHint,
  holdingDeadline,
} from "./holding-explanation";
import {
  downloadCsv,
  printDocument,
  formatHoldingPeriod,
} from "@codementor/utils";
type Tab = "overview" | "orders" | "withdrawals" | "ledger";
type Detail =
  | { type: "order"; item: CommerceOrder }
  | { type: "withdrawal"; item: CommerceWithdrawal }
  | { type: "ledger"; item: CommerceLedgerEntry };
export function EarningsScreen() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [days, setDays] = useState(30);
  const [dateRange, setDateRange] = useState<RevenueDateRange | null>(null);
  const [report, setReport] = useState<RevenueReport | null>(null);
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
  const scopeKey = `${tab}-${page}-${sort}-${days}-${dateRange?.from ?? ""}-${dateRange?.to ?? ""}`;
  const [loadedScope, setLoadedScope] = useState("");
  const generation = useRef(0);
  const inFlight = useRef(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const load = useCallback(
    async (quiet = false) => {
      if (quiet && inFlight.current > 0) return;
      inFlight.current++;
      const requestGeneration = ++generation.current;
      if (!quiet) {
        setLoading(true);
        if (tab === "overview") setReport(null);
      }
      try {
        const [summary, result] = await Promise.all([
          earningsApi.wallet(),
          tab === "overview"
            ? earningsApi.analytics(days, dateRange)
            : tab === "orders"
              ? earningsApi.orders(page, sort)
              : tab === "withdrawals"
                ? earningsApi.withdrawals(page, sort)
                : earningsApi.ledger(page, sort),
        ]);
        if (requestGeneration !== generation.current) return;
        setWallet(summary);
        if (tab === "overview") setReport(result as RevenueReport);
        if (tab === "orders") {
          const fresh = result as CommercePage<CommerceOrder>;
          setOrders(fresh);
          setDetail((previous) =>
            previous?.type === "order"
              ? {
                  ...previous,
                  item:
                    fresh.items.find((item) => item.id === previous.item.id) ??
                    previous.item,
                }
              : previous,
          );
        }
        if (tab === "withdrawals")
          setWithdrawals(result as CommercePage<CommerceWithdrawal>);
        if (tab === "ledger")
          setLedger(result as CommercePage<CommerceLedgerEntry>);
        setError("");
        setUpdatedAt(Date.now());
      } catch (e) {
        if (requestGeneration !== generation.current) return;
        if (!quiet && tab === "overview") setReport(null);
        setError(
          quiet
            ? `Chưa cập nhật được dữ liệu mới: ${apiErrorMessage(e)}`
            : apiErrorMessage(e),
        );
      } finally {
        inFlight.current--;
        if (requestGeneration === generation.current) {
          setLoading(false);
          setLoadedScope(scopeKey);
        }
      }
    },
    [tab, page, sort, days, dateRange, scopeKey],
  );
  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      generation.current++;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  const current =
    tab === "orders"
      ? orders
      : tab === "withdrawals"
        ? withdrawals
        : tab === "ledger"
          ? ledger
          : null;
  function exportCurrent() {
    if (tab === "orders") {
      downloadCsv(
        "doanh-thu-khoa-hoc.csv",
        [
          "Khóa học",
          "Học viên",
          "Email",
          "Ngày",
          "Giá bán",
          "Doanh thu",
          "Trạng thái",
        ],
        (orders?.items ?? []).map((o) => [
          o.courseTitle,
          o.buyer?.name ?? "Học viên",
          o.buyer?.email ?? "",
          new Date(o.createdAt).toLocaleString("vi-VN"),
          o.amount,
          o.instructorAmount,
          COMMERCE_STATUS[o.status] ?? o.status,
        ]),
      );
    } else if (tab === "withdrawals") {
      downloadCsv(
        "yeu-cau-rut-tien.csv",
        [
          "Mã yêu cầu",
          "Ngày",
          "Số tiền",
          "Phương thức",
          "Tài khoản nhận",
          "Trạng thái",
        ],
        (withdrawals?.items ?? []).map((w) => [
          w.id,
          new Date(w.createdAt).toLocaleString("vi-VN"),
          w.amount,
          w.recipient.method.toUpperCase(),
          `${w.recipient.institutionCode} · ****${w.recipient.accountNumber?.slice(-4)}`,
          COMMERCE_STATUS[w.status] ?? w.status,
        ]),
      );
    } else {
      downloadCsv(
        "bien-dong-so-du.csv",
        ["Ngày", "Sự kiện", "Loại số dư", "Biến động", "Mã tham chiếu"],
        (ledger?.items ?? []).map((e) => [
          new Date(e.createdAt).toLocaleString("vi-VN"),
          e.event.split(":")[0],
          COMMERCE_STATUS[e.account] ?? e.account,
          e.amount,
          e.orderId ?? e.withdrawalId ?? "",
        ]),
      );
    }
  }
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        icon={Wallet}
        title="Doanh thu"
        description="Theo dõi doanh thu khóa học, số dư và các yêu cầu rút tiền."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHelp(true)}>
              <CircleHelp className="size-4" /> Hướng dẫn
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => void load()}
            >
              <RefreshCw className="size-4" /> Làm mới
            </Button>
          </div>
        }
      />
      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Cập nhật lúc{" "}
          {new Date(updatedAt).toLocaleTimeString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
          })}{" "}
          · Tự cập nhật mỗi 15 giây khi trang đang mở
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {wallet && tab !== "overview" && (
        <>
          <StatStrip
            stats={[
              ["pending", "Doanh thu đang chờ"],
              ["available", "Sẵn sàng rút"],
              ["reserved", "Đang xử lý rút"],
              ["paid", "Đã chi trả"],
            ].map(([key, label]) => ({
              label,
              value: vnd(wallet.balances[key] ?? 0),
            }))}
          />
          <p className="text-sm text-muted-foreground">
            Chính sách hiện tại: bạn nhận {wallet.policy.instructorBps / 100}%
            trên đơn mới; giữ doanh thu{" "}
            {formatHoldingPeriod(
              wallet.policy.holdMinutes ?? wallet.policy.holdDays * 1440,
            )}{" "}
            tính từ khi xác nhận thanh toán. Hết thời gian giữ vẫn cần đối soát
            và đủ điều kiện hoàn tiền trước khi mở số dư. Đơn cũ giữ cả tỷ lệ và
            thời gian đã lưu; xem ngày dự kiến trong chi tiết đơn.
          </p>
          {(wallet.balances.refund_held > 0 || wallet.balances.debt < 0) && (
            <Card className="p-4 text-sm">
              Giữ để hoàn tiền: {vnd(wallet.balances.refund_held)} · Cần bù trừ
              từ thu nhập sau: {vnd(-wallet.balances.debt)}
            </Card>
          )}
          {tab === "withdrawals" && (
            <WithdrawalForm wallet={wallet} refresh={load} />
          )}
        </>
      )}
      {wallet && <HoldingExplanation wallet={wallet} />}
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {/* Cùng kiểu tab với mọi màn khác: bốn nút đặc/viền rời nhau trước đây đọc như bốn
              hành động chứ không phải bốn góc nhìn của một dữ liệu. */}
          <SegmentedTabs
            onChange={(key) => {
              setTab(key as Tab);
              setPage(1);
            }}
            options={[
              { value: "overview", label: "Tổng quan doanh thu" },
              { value: "orders", label: "Đơn hàng" },
              { value: "withdrawals", label: "Yêu cầu rút" },
              { value: "ledger", label: "Biến động số dư" },
            ]}
            value={tab}
          />
          {tab !== "overview" && (
            <>
              <Button
                variant="outline"
                className="ml-auto"
                disabled={!current?.items.length}
                onClick={exportCurrent}
              >
                <Download className="size-4" /> Xuất CSV trang này
              </Button>
              <select
                aria-label="Sắp xếp dữ liệu"
                className="h-9 min-w-40 rounded-lg border bg-background px-3 text-sm transition-colors focus-visible:border-ring"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="amount_high">Số tiền cao nhất</option>
                <option value="amount_low">Số tiền thấp nhất</option>
              </select>
            </>
          )}
        </div>
        {tab === "overview" ? (
          <div className="p-4">
            <RevenueOverview
              defaultView="all"
              report={report}
              days={days}
              onDaysChange={setDays}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              loading={loading || loadedScope !== scopeKey}
              extraViews={[
                {
                  id: "balances",
                  label: "Số dư & khả năng rút",
                  content: <LecturerRevenueBalances wallet={wallet} />,
                },
              ]}
              onExport={() =>
                report &&
                downloadCsv(
                  "bao-cao-doanh-thu.csv",
                  [
                    "Ngày (giờ Việt Nam)",
                    "Số đơn đã thanh toán",
                    "Giá trị đơn",
                    "Doanh thu giảng viên trước phí",
                    "Hoàn tiền của đơn trong kỳ",
                  ],
                  report.daily.map((d) => [
                    d.date,
                    d.orders,
                    d.gross,
                    d.revenue,
                    d.refunded,
                  ]),
                )
              }
            />
          </div>
        ) : loading ? (
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
                    <th className="whitespace-nowrap p-3 font-medium" key={h}>
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
                        <div className="flex items-center gap-3">
                          <CourseCover
                            src={o.courseCoverImageUrl}
                            title={o.courseTitle}
                            className="size-11"
                          />
                          <div>
                            <p className="font-medium">{o.courseTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
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
                      <td className="whitespace-nowrap p-3">{vnd(o.amount)}</td>
                      <td className="whitespace-nowrap p-3">
                        {vnd(o.instructorAmount)} ({o.instructorBps / 100}%)
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
                        <OrderHoldingHint order={o} />
                      </td>
                      <td className="whitespace-nowrap p-3">
                        <Button
                          variant="outline"
                          onClick={() => setDetail({ type: "order", item: o })}
                        >
                          <Eye className="size-4" /> Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                {tab === "withdrawals" &&
                  withdrawals?.items.map((w) => (
                    <tr key={w.id}>
                      <td className="p-3">
                        <p>{new Date(w.createdAt).toLocaleString("vi-VN")}</p>
                        <p
                          className="max-w-48 truncate text-xs text-muted-foreground tabular-nums"
                          title={w.id}
                        >
                          {w.id}
                        </p>
                      </td>
                      <td className="p-3">{vnd(w.amount)}</td>
                      <td className="p-3">
                        {w.recipient.label}
                        <p className="text-xs text-muted-foreground">
                          {w.recipient.institutionCode} · ••••
                          {w.recipient.accountNumber?.slice(-4)}
                        </p>
                      </td>
                      <td className="p-3">
                        {COMMERCE_STATUS[w.status]}
                        <p className="text-xs text-muted-foreground">
                          {w.reason}
                        </p>
                      </td>
                      <td className="whitespace-nowrap p-3">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setDetail({ type: "withdrawal", item: w })
                          }
                        >
                          <Eye className="size-4" /> Chi tiết
                        </Button>
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
                      <td className="whitespace-nowrap p-3 font-medium">
                        {e.amount > 0 ? "+" : ""}
                        {vnd(e.amount)}
                      </td>
                      <td
                        className="max-w-48 truncate p-3 text-xs text-muted-foreground tabular-nums"
                        title={e.orderId ?? e.withdrawalId ?? undefined}
                      >
                        {e.orderId ?? e.withdrawalId}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        <Button
                          variant="outline"
                          onClick={() => setDetail({ type: "ledger", item: e })}
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
        {tab !== "overview" && (
          <ServerPagination
            page={page}
            total={current?.total ?? 0}
            pageSize={current?.limit ?? 20}
            disabled={loading}
            onPageChange={setPage}
          />
        )}
      </Card>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="Hướng dẫn quản lý doanh thu"
      >
        <div className="space-y-4 text-sm">
          <Guide number="1" title="Đọc biểu đồ và số dư">
            Tổng quan hiển thị doanh thu theo ngày xác nhận thanh toán, dùng tỷ
            lệ đã lưu của từng đơn. Loại trừ đơn đã hoàn tiền và chưa trừ phí
            cổng thanh toán. Số dư phía trên là toàn bộ lịch sử, không bị giới
            hạn bởi bộ chọn thời gian của biểu đồ.
          </Guide>
          <Guide number="2" title="Khi nào có số dư khả dụng?">
            Thanh toán đã xác nhận vẫn phải chờ hết thời gian giữ của đơn và đủ
            điều kiện đối soát. Xem ngày dự kiến tại Chi tiết đơn. Đối soát
            không bỏ qua thời gian chờ; có sai lệch hoặc hoàn tiền đang xử lý
            thì doanh thu có thể chưa được mở.
          </Guide>
          <Guide number="3" title="Thiết lập nơi nhận tiền & yêu cầu rút">
            Mở tab Yêu cầu rút để lưu phương thức nhận tiền, nhập số tiền và gửi
            duyệt. Chỉ rút từ số dư Sẵn sàng rút; duyệt yêu cầu không đồng nghĩa
            đã nhận tiền. Theo dõi trạng thái và lý do trong Chi tiết.
          </Guide>
          <Guide number="4" title="Xuất và đối chiếu">
            CSV ở Tổng quan xuất số liệu toàn kỳ đã chọn (7/30/90 ngày hoặc
            khoảng ngày tùy ý); CSV trong bảng lịch sử chỉ xuất trang đang xem.
            Mở Chi tiết để in/lưu PDF chứng từ; chứng từ giao dịch không thay
            thế hóa đơn thuế.
          </Guide>
        </div>
      </Modal>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={
          detail?.type === "order"
            ? "Chi tiết đơn hàng"
            : detail?.type === "withdrawal"
              ? "Chi tiết yêu cầu rút"
              : "Chi tiết biến động số dư"
        }
      >
        {detail && <DetailView detail={detail} />}
      </Modal>
    </div>
  );
}

function Guide({
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
function DetailView({ detail }: { detail: Detail }) {
  if (detail.type === "order") {
    const item = detail.item;
    return (
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <CourseCover
            src={item.courseCoverImageUrl}
            title={item.courseTitle}
            className="size-16"
          />
          <div>
            <h3 className="font-semibold">{item.courseTitle}</h3>
            <p className="text-xs text-muted-foreground">#{item.id}</p>
          </div>
        </div>
        <DetailRows
          rows={[
            [
              "Học viên",
              `${item.buyer?.name ?? "Học viên"} · ${item.buyer?.email ?? ""}`,
            ],
            ["Ngày mua", new Date(item.createdAt).toLocaleString("vi-VN")],
            ["Giá bán", vnd(item.amount)],
            [
              "Doanh thu của bạn",
              `${vnd(item.instructorAmount)} (${item.instructorBps / 100}%)`,
            ],
            [
              "Trạng thái thanh toán",
              COMMERCE_STATUS[item.status] ?? item.status,
            ],
            [
              "Trạng thái doanh thu",
              COMMERCE_INCOME_STATUS[item.incomeState] ?? item.incomeState,
            ],
            [
              "Dự kiến khả dụng",
              item.availableAt
                ? `${holdingDeadline(item.availableAt)} · đủ điều kiện sau đối soát`
                : "Chưa xác định",
            ],
            [
              "Thời gian giữ đã lưu",
              item.holdMinutes != null
                ? formatHoldingPeriod(item.holdMinutes)
                : "Theo chính sách tại thời điểm tạo đơn",
            ],
            ["Mã đơn", item.id],
          ]}
          title="Chứng từ doanh thu khóa học"
        />
        <OrderHoldingHint order={item} />
      </div>
    );
  }
  if (detail.type === "withdrawal") {
    const item = detail.item;
    return (
      <DetailRows
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
          ["Ghi chú", item.reason ?? "Không có"],
        ]}
      />
    );
  }
  const item = detail.item;
  return (
    <DetailRows
      title="Phiếu biến động số dư"
      rows={[
        ["Mã biến động", item.id],
        ["Thời điểm", new Date(item.createdAt).toLocaleString("vi-VN")],
        ["Sự kiện", item.event.split(":")[0]],
        ["Loại số dư", COMMERCE_STATUS[item.account] ?? item.account],
        ["Giá trị", `${item.amount > 0 ? "+" : ""}${vnd(item.amount)}`],
        ["Tham chiếu", item.orderId ?? item.withdrawalId ?? "Không có"],
      ]}
    />
  );
}
function DetailRows({
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
