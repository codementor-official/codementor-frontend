"use client";

import { useEffect, useState } from "react";
import { AlarmClock, CircleAlert, CreditCard, Hourglass, SearchCheck, UserRound } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Card, InfoHint } from "@codementor/ui";
import { formatBytes, formatVnDate, formatVnd, usagePercent } from "@codementor/utils";
import type { AuditEntry, BillingOverview, StorageOverview } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { plansApi } from "./api";
import { AuditSubject, TraceLink, useTrace } from "./trace";

const ACTION_LABEL: Record<string, string> = {
  "workspace_subscription.activated": "Kích hoạt gói",
  "workspace_subscription.renewed": "Gia hạn",
  "workspace_subscription.upgraded": "Nâng cấp",
  "workspace_subscription.cancel_scheduled": "Tắt gia hạn",
  "workspace_subscription.cancel_reverted": "Bật lại gia hạn",
  "workspace_subscription.change_scheduled": "Lên lịch đổi gói",
  "workspace_subscription.suspended": "Tạm ngưng gói",
  "workspace_subscription.restored": "Khôi phục gói",
  "workspace_subscription.renewal_reminder": "Nhắc gia hạn",
  "workspace_subscription.grace_notice": "Báo bắt đầu ân hạn",
  "workspace_subscription.overage_notice": "Báo vượt hạn mức",
  "workspace_payment.review": "Thanh toán cần kiểm tra",
  "workspace_payment.reference_conflict": "Mã giao dịch trùng",
  "workspace_plan.created": "Tạo gói",
  "workspace_plan.updated": "Sửa thông tin gói",
  "workspace_plan.draft_saved": "Lưu bản nháp",
  "workspace_plan.draft_discarded": "Bỏ bản nháp",
  "workspace_plan.published": "Xuất bản phiên bản",
  "workspace_order.created": "Tạo đơn",
  "workspace_order.paid": "Đơn đã thanh toán",
  "workspace_order.failed": "Đơn thất bại",
  "workspace_order.cancelled": "Đơn bị huỷ",
  "workspace_order.expired": "Đơn hết hạn",
  "workspace_order.review": "Đơn cần kiểm tra",
  "workspace_order.refunded": "Hoàn tiền",
  "workspace_coupon.created": "Tạo mã giảm giá",
  "workspace_coupon.activated": "Bật mã giảm giá",
  "workspace_coupon.updated": "Sửa mã giảm giá",
  "workspace_coupon.deactivated": "Tắt mã giảm giá",
  "workspace_adjustment.created": "Cấp hạn mức ngoại lệ",
  "workspace_adjustment.revoked": "Thu hồi hạn mức ngoại lệ",
  "workspace_settings.updated": "Đổi cài đặt",
};

export function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action.replace(/^workspace_/, "").replace(/[._]/g, " ");
}

export function OverviewTab() {
  const request = useAdminApi();
  const [data, setData] = useState<BillingOverview | null>(null);
  const [storage, setStorage] = useState<StorageOverview | null>(null);
  const [events, setEvents] = useState<AuditEntry[] | null>(null);
  const trace = useTrace();
  const [error, setError] = useState("");

  useEffect(() => {
    plansApi.overview(request).then(setData).catch((e) => setError(apiErrorMessage(e)));
    plansApi.storage(request).then(setStorage).catch(() => setStorage(null));
    plansApi.audit(request, { page: 1, limit: 12 }).then((p) => setEvents(p.items)).catch(() => setEvents([]));
  }, [request]);

  if (error) return <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>;
  const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          { icon: CreditCard, label: "Đang trả phí", value: data?.paidSubscribers, hint: "Gói đang hoạt động hoặc đã tắt gia hạn nhưng còn kỳ", go: () => trace.goTab("subscribers", { sState: "ACTIVE" }) },
          { icon: UserRound, label: "Tài khoản Free", value: data?.freeAccounts, hint: "Mọi tài khoản chưa có gói trả phí đang hiệu lực" },
          { icon: Hourglass, label: "Đang ân hạn", value: data?.gracePeriod, hint: "Hết kỳ, chưa gia hạn, vẫn giữ hạn mức", go: () => trace.goTab("subscribers", { sState: "GRACE_PERIOD" }) },
          { icon: AlarmClock, label: "Hết hạn trong 7 ngày", value: data?.expiringIn7Days, hint: "Xem biểu đồ “Sắp đến hạn” ở tab Người đăng ký", go: () => trace.goTab("subscribers") },
          { icon: CircleAlert, label: "Thanh toán lỗi (30 ngày)", value: data?.failedPayments30d, hint: "Đơn thất bại trong 30 ngày", go: () => trace.goTab("orders", { oStatus: "failed" }) },
          { icon: SearchCheck, label: "Đơn chờ kiểm tra", value: data?.ordersInReview, hint: "Đã trả tiền nhưng chưa áp dụng tự động: cần xử lý", go: () => trace.goTab("orders", { oStatus: "review" }) },
        ].map((k) => {
          const body = (
            <>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><k.icon className="size-3.5" aria-hidden />{k.label}</span>
              <span className="mt-1 block text-2xl font-semibold">{k.value === undefined ? "—" : k.value.toLocaleString("vi-VN")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{k.hint}{k.go ? " →" : ""}</span>
            </>
          );
          return (
            <Card key={k.label} className={`p-3 ${k.go ? "transition-colors hover:bg-muted/50" : ""}`}>
              {k.go ? <button type="button" className="w-full text-left" onClick={k.go}>{body}</button> : body}
            </Card>
          );
        })}
      </div>

      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Giá trị hợp đồng / tháng
              <InfoHint text="Tổng giá các gói đang hiệu lực quy về tháng. Gói gia hạn thủ công nên đây không phải doanh thu định kỳ được đảm bảo." />
            </p>
            <p className="mt-1 text-2xl font-semibold">{formatVnd(data.contractedMonthlyValueVnd)}</p>
            <p className="mt-3 text-xs text-muted-foreground">Doanh thu 30 ngày: <strong className="text-foreground">{formatVnd(data.revenue30dVnd)}</strong></p>
            <p className="text-xs text-muted-foreground">Tổng doanh thu: <strong className="text-foreground">{formatVnd(data.revenueTotalVnd)}</strong></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Chuyển đổi trả phí</p>
            <p className="mt-1 text-2xl font-semibold">{pct(data.conversionRate)}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              Tỷ lệ gia hạn (90 ngày): <strong className="text-foreground">{pct(data.renewalRate)}</strong>
              <InfoHint text="Trong các kỳ đã kết thúc 90 ngày qua, tỷ lệ kỳ được gia hạn tiếp." />
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Dung lượng Workspace</p>
            <p className="mt-1 text-2xl font-semibold">{storage ? formatBytes(storage.storedBytes) : "—"}</p>
            {storage && (
              <p className="mt-3 text-xs text-muted-foreground">
                {storage.groups} nhóm · {storage.owners} chủ nhóm · {formatBytes(storage.reservedBytes)} đang tải lên
              </p>
            )}
          </Card>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <h3 className="border-b px-4 py-3 text-sm font-semibold">Doanh thu theo gói</h3>
          <table className="w-full text-sm">
            <tbody>
              {data?.revenueByPlan.map((p) => (
                <tr key={p.planId} className="cursor-pointer border-t first:border-t-0 hover:bg-muted/50" onClick={() => trace.goTab("subscribers", { sPlan: p.planId })}>
                  <td className="px-4 py-2 font-medium text-primary">{p.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.activeSubscriptions} đang mở</td>
                  <td className="px-4 py-2 text-right">{formatVnd(p.revenueVnd)}</td>
                </tr>
              ))}
              {data?.revenueByPlan.length === 0 && <tr><td className="px-4 py-3 text-muted-foreground">Chưa có doanh thu.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <h3 className="border-b px-4 py-3 text-sm font-semibold">Phân bố dung lượng theo chủ nhóm</h3>
          <ul className="space-y-2 p-4 text-sm">
            {storage?.distribution.map((d) => {
              const max = Math.max(...storage.distribution.map((x) => x.owners), 1);
              return (
                <li key={d.bucket} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
                  <span className="text-muted-foreground">{d.bucket}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(d.owners / max) * 100}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{d.owners}</span>
                </li>
              );
            })}
            {!storage && <li className="text-muted-foreground">Không tải được số liệu dung lượng.</li>}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <h3 className="border-b px-4 py-3 text-sm font-semibold">Chủ nhóm gần hoặc đã vượt hạn mức</h3>
          <table className="w-full text-sm">
            <tbody>
              {storage?.nearLimit.map((o) => (
                <tr key={o.ownerId} className="cursor-pointer border-t first:border-t-0 hover:bg-muted/50" onClick={() => trace.openUser(o.ownerId)}>
                  <td className="px-4 py-2">
                    <span className="block font-medium text-primary">{o.name}</span>
                    <span className="block text-xs text-muted-foreground">{o.email} · {o.plan}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    {formatBytes(o.usedBytes)} / {formatBytes(o.maxStorageBytes)} ({usagePercent(o.usedBytes, o.maxStorageBytes)}%)
                    <br />
                    {o.ownedGroups} / {o.maxOwnedGroups} nhóm
                  </td>
                </tr>
              ))}
              {storage?.nearLimit.length === 0 && <tr><td className="px-4 py-3 text-muted-foreground">Không có chủ nhóm nào gần hạn mức.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Sự kiện gần đây</h3>
            <TraceLink className="ml-auto text-xs" onClick={() => trace.goTab("audit")}>Xem toàn bộ nhật ký →</TraceLink>
          </div>
          <ul className="divide-y text-sm">
            {events?.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{formatVnDate(e.created_at, true)}</span>
                <span className="font-medium">{actionLabel(e.action)}</span>
                <AuditSubject entry={e} />
                <span className="ml-auto text-xs text-muted-foreground">{e.actor ?? "Hệ thống"}</span>
              </li>
            ))}
            {events?.length === 0 && <li className="px-4 py-3 text-muted-foreground">Chưa có sự kiện.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
