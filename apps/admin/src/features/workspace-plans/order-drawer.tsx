"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, ReasonButton, SideDrawer, StatusBadge, useToast } from "@codementor/ui";
import { formatBytes, formatLimit, formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminOrderDetail } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { plansApi } from "./api";
import { actionLabel } from "./overview-tab";
import { KIND, ORDER_LABEL, ORDER_TONE } from "./operations-tabs";
import { TraceLink, useTrace } from "./trace";

const PROVIDER: Record<string, string> = { vnpay: "VNPAY", momo: "MoMo", mock: "Thử nghiệm" };
const PAYMENT_STATUS: Record<string, string> = {
  pending: "Đang chờ",
  succeeded: "Thành công",
  failed: "Thất bại",
  cancelled: "Đã huỷ",
  unknown: "Chưa rõ",
};
const ACCOUNT: Record<string, string> = { clearing: "Tiền chờ đối soát", platform: "Doanh thu nền tảng" };

/** One order end to end: who paid what for which terms, through which gateway, and what followed. */
export function OrderDrawer({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const request = useAdminApi();
  const toast = useToast();
  const trace = useTrace();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      plansApi
        .order(request, orderId)
        .then((o) => {
          setError("");
          setOrder(o);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [request, orderId],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function run(work: () => Promise<unknown>, done: string) {
    try {
      await work();
      toast.success(done);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  const q = order?.quote;
  return (
    <SideDrawer open onClose={onClose} width="wide" title={order ? `${KIND[order.kind]} ${order.planName}` : "Giao dịch"} description={order ? `Mã đơn ${order.id}` : undefined}>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
      {!order && !error && <div className="h-40 animate-pulse rounded-md bg-muted" aria-hidden />}
      {order && q && (
        <div className="space-y-5 text-sm">
          <section className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</StatusBadge>
            <span className="text-2xl font-semibold">{formatVnd(order.amountVnd)}</span>
            <span className="text-muted-foreground">{order.mode === "sandbox" ? "Cổng thử nghiệm (sandbox)" : "Thanh toán giả lập"}</span>
            <div className="ml-auto flex gap-2">
              {(order.status === "pending" || order.status === "review") && order.mode !== "mock" && (
                <Button size="sm" variant="outline" onClick={() => run(() => plansApi.reconcile(request, order.id), "Đã đối soát với cổng thanh toán")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Đối soát
                </Button>
              )}
              {(order.status === "paid" || order.status === "review") && (
                <ReasonButton
                  size="sm"
                  variant="danger"
                  title={`Ghi nhận hoàn ${formatVnd(order.amountVnd)}?`}
                  description="Chỉ ghi nhận sau khi đã hoàn tiền trên cổng thanh toán. Sổ cái được bù trừ; nếu kỳ của đơn chưa kết thúc, gói kết thúc ngay và tài khoản về Free (dữ liệu vẫn giữ)."
                  placeholder="Lý do · mã hoàn tiền trên cổng (nếu có)"
                  onConfirm={(reason) => run(() => plansApi.refund(request, order.id, reason), "Đã ghi nhận hoàn tiền")}
                >
                  Hoàn tiền
                </ReasonButton>
              )}
            </div>
          </section>

          <Section title="Người mua">
            <TraceLink onClick={() => trace.openUser(order.buyer.id)}>{order.buyer.name}</TraceLink>
            <span className="ml-2 text-muted-foreground">{order.buyer.email}</span>
          </Section>

          <Section title="Báo giá đã chốt" hint={`Chốt lúc ${formatVnDate(q.quotedAt, true)} · điều khoản ${q.termsVersion}. Giá trên đơn không đổi dù bảng giá thay đổi sau đó.`}>
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
              <dt className="text-muted-foreground">
                Gói {q.plan.name} v{q.plan.version} · theo {q.billingCycle === "year" ? "năm" : "tháng"}
              </dt>
              <dd className="text-right">{formatVnd(q.listPriceVnd)}</dd>
              {q.discountVnd > 0 && (
                <>
                  <dt className="text-muted-foreground">
                    Mã giảm giá{" "}
                    {order.coupon?.id ? <TraceLink onClick={() => trace.openCoupon(order.coupon!.id!)}>{order.coupon.code}</TraceLink> : q.coupon?.code}
                    {q.coupon && ` (${q.coupon.kind === "percent" ? `${q.coupon.value}%` : formatVnd(q.coupon.value)})`}
                  </dt>
                  <dd className="text-right">−{formatVnd(q.discountVnd)}</dd>
                </>
              )}
              {q.creditVnd > 0 && q.credit && (
                <>
                  <dt className="text-muted-foreground">
                    Trừ phần chưa dùng của kỳ {formatVnDate(q.credit.termStart)} – {formatVnDate(q.credit.termEnd)} của gói đang dùng
                  </dt>
                  <dd className="text-right">−{formatVnd(q.creditVnd)}</dd>
                </>
              )}
              <dt className="border-t pt-1 font-medium">Phải trả</dt>
              <dd className="border-t pt-1 text-right font-semibold">{formatVnd(q.amountVnd)}</dd>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Hạn mức mua: {formatLimit(q.entitlements.maxOwnedGroups)} nhóm · {formatLimit(q.entitlements.maxMembersPerGroup)} thành viên/nhóm ·{" "}
              {formatBytes(q.entitlements.maxStorageBytes)} · tệp {formatBytes(q.entitlements.maxUploadBytes)} · {formatLimit(q.entitlements.monthlyAiRequests)} lượt AI/tháng
              {q.startsAt && ` · kỳ mới bắt đầu ${formatVnDate(q.startsAt)}`}
            </p>
          </Section>

          <Section title="Thanh toán">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1 font-medium">Cổng</th><th className="font-medium">Trạng thái</th><th className="font-medium">Mã giao dịch cổng</th><th className="font-medium">Tạo lúc</th><th className="font-medium">Đối soát</th></tr>
              </thead>
              <tbody>
                {order.payments.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{PROVIDER[p.provider] ?? p.provider}</td>
                    <td>{PAYMENT_STATUS[p.status] ?? p.status}</td>
                    <td className="font-mono">{p.reference ?? "—"}</td>
                    <td>{formatVnDate(p.createdAt, true)}</td>
                    <td>{p.reconciledAt ? formatVnDate(p.reconciledAt, true) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-muted-foreground">
              Tạo đơn {formatVnDate(order.createdAt, true)}
              {order.paidAt ? ` · trả lúc ${formatVnDate(order.paidAt, true)}` : ` · hết hạn ${formatVnDate(order.expiresAt, true)}`}
            </p>
          </Section>

          <Section title="Sổ cái" hint="Mỗi bút toán cân bằng: tiền vào tài khoản chờ đối soát rồi chuyển sang doanh thu; hoàn tiền đi chiều ngược lại.">
            {order.ledger.length === 0 ? (
              <p className="text-muted-foreground">Chưa có bút toán (đơn chưa được thanh toán).</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {order.ledger.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-32 text-muted-foreground">{formatVnDate(e.at, true)}</span>
                    <span className="flex-1">{ACCOUNT[e.account] ?? e.account}</span>
                    <span className={`tabular-nums ${e.amountVnd < 0 ? "text-destructive" : ""}`}>{e.amountVnd > 0 ? "+" : ""}{formatVnd(e.amountVnd)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Diễn biến">
            <ol className="space-y-2 border-l pl-4">
              {order.history.map((h, i) => (
                <li key={i}>
                  <p className="font-medium">{actionLabel(h.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatVnDate(h.at, true)} · {h.actor ?? "Hệ thống"}
                    {typeof h.details === "object" && h.details && "reason" in h.details ? ` · ${String((h.details as { reason: unknown }).reason)}` : ""}
                  </p>
                </li>
              ))}
            </ol>
            {order.subscriptionId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Gói tạo ra từ đơn này: <TraceLink onClick={() => trace.openUser(order.buyer.id)}>xem trong chi tiết người mua</TraceLink>
              </p>
            )}
          </Section>
        </div>
      )}
    </SideDrawer>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-semibold">{title}</h3>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </section>
  );
}
