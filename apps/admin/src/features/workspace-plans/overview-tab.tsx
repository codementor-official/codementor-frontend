"use client";

import { useEffect, useState } from "react";
import { AlarmClock, CircleAlert, CreditCard, Hourglass, SearchCheck, UserRound } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Card, InfoHint, KpiStrip } from "@codementor/ui";
import { formatBytes, formatVnDate, formatVnd, usagePercent } from "@codementor/utils";
import type { BillingOverview, StorageOverview } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { plansApi } from "./api";

const ACTION_LABEL: Record<string, string> = {
  "workspace_subscription.activated": "Kích hoạt gói",
  "workspace_subscription.renewed": "Gia hạn",
  "workspace_subscription.upgraded": "Nâng cấp",
  "workspace_subscription.cancel_scheduled": "Huỷ gia hạn",
  "workspace_subscription.cancel_reverted": "Bật lại gia hạn",
  "workspace_subscription.change_scheduled": "Lên lịch đổi gói",
  "workspace_subscription.suspended": "Tạm ngưng",
  "workspace_subscription.restored": "Khôi phục",
  "workspace_payment.review": "Thanh toán cần kiểm tra",
  "workspace_plan.published": "Xuất bản phiên bản",
  "workspace_order.created": "Tạo đơn",
};

export function actionLabel(action: string) {
  return ACTION_LABEL[action] ?? action.replace(/^workspace_/, "").replace(/[._]/g, " ");
}

export function OverviewTab() {
  const request = useAdminApi();
  const [data, setData] = useState<BillingOverview | null>(null);
  const [storage, setStorage] = useState<StorageOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    plansApi.overview(request).then(setData).catch((e) => setError(apiErrorMessage(e)));
    plansApi.storage(request).then(setStorage).catch(() => setStorage(null));
  }, [request]);

  if (error) return <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>;
  const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

  return (
    <div className="space-y-4">
      <KpiStrip
        loading={!data}
        metrics={[
          { icon: CreditCard, label: "Đang trả phí", value: data?.paidSubscribers ?? null },
          { icon: UserRound, label: "Tài khoản Free", value: data?.freeAccounts ?? null },
          { icon: Hourglass, label: "Đang ân hạn", value: data?.gracePeriod ?? null },
          { icon: AlarmClock, label: "Hết hạn trong 7 ngày", value: data?.expiringIn7Days ?? null },
          { icon: CircleAlert, label: "Thanh toán lỗi (30 ngày)", value: data?.failedPayments30d ?? null },
          { icon: SearchCheck, label: "Đơn chờ kiểm tra", value: data?.ordersInReview ?? null },
        ]}
      />

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
                <tr key={p.planId} className="border-t first:border-t-0">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
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
                <tr key={o.ownerId} className="border-t first:border-t-0">
                  <td className="px-4 py-2">
                    <span className="block font-medium">{o.name}</span>
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
          <h3 className="border-b px-4 py-3 text-sm font-semibold">Sự kiện gần đây</h3>
          <ul className="divide-y text-sm">
            {data?.recentEvents.map((e, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">{formatVnDate(e.at, true)}</span>
                <span>{actionLabel(e.action)}</span>
              </li>
            ))}
            {data?.recentEvents.length === 0 && <li className="px-4 py-3 text-muted-foreground">Chưa có sự kiện.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
