"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, InfoHint, ServerPagination, StatusBadge, useUrlState } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, BillingPage, OverageOwner, SubscriberRow, SubscriberStats, SubscriptionState } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";
import { SubscriberStatsPanel } from "./subscriber-stats";
import { TraceLink, useTrace } from "./trace";

const STAGE_LABEL: Record<OverageOwner["stage"], { label: string; tone: "warning" | "danger" }> = {
  notice: { label: "Đang cảnh báo", tone: "warning" },
  read_only: { label: "Nhóm chỉ đọc", tone: "danger" },
  hidden: { label: "Nhóm tạm ẩn", tone: "danger" },
};

export const STATE: Record<SubscriptionState, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  FREE: { label: "Free", tone: "neutral" },
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  CANCEL_SCHEDULED: { label: "Đã huỷ gia hạn", tone: "warning" },
  GRACE_PERIOD: { label: "Ân hạn", tone: "warning" },
  EXPIRED: { label: "Hết hạn", tone: "danger" },
  CANCELLED: { label: "Đã kết thúc", tone: "neutral" },
  SUSPENDED: { label: "Tạm ngưng", tone: "danger" },
};

export function SubscribersTab() {
  const request = useAdminApi();
  const [page, setPage] = useUrlState("sPage", 1);
  const [q, setQ] = useUrlState("sQ", "");
  const [planId, setPlanId] = useUrlState("sPlan", "");
  const [state, setState] = useUrlState("sState", "");
  const [search, setSearch] = useState(q);
  const [data, setData] = useState<BillingPage<SubscriberRow> | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [error, setError] = useState("");
  const trace = useTrace();
  const [overage, setOverage] = useState<OverageOwner[] | null>(null);
  const [stats, setStats] = useState<SubscriberStats | null>(null);

  const load = useCallback(
    () =>
      plansApi
        .subscribers(request, { page, q: q || undefined, planId: planId || undefined, state: state || undefined })
        .then((d) => {
          setError("");
          setData(d);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [request, page, q, planId, state],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    plansApi.plans(request).then(setPlans).catch(() => setPlans([]));
    plansApi.subscriberStats(request).then(setStats).catch(() => setStats(null));
    plansApi.overage(request).then(setOverage).catch(() => setOverage([]));
  }, [request]);
  const filtered = Boolean(q || planId || state);

  return (
    <div className="space-y-4">
      <SubscriberStatsPanel
        stats={stats}
        onFilter={(f) => {
          if (f.planId !== undefined) setPlanId(f.planId);
          if (f.state !== undefined) setState(f.state);
          setPage(1);
        }}
      />
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search.trim());
          setPage(1);
        }}
      >
        <div>
          <label htmlFor="sub-q" className="text-xs text-muted-foreground">Tìm theo tên hoặc email</label>
          <input id="sub-q" className={`${inputClassName} w-64`} value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sub-plan" className="text-xs text-muted-foreground">Gói</label>
          <select id="sub-plan" className={inputClassName} value={planId} onChange={(e) => { setPlanId(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {plans.filter((p) => !p.isDefault).map((p) => (
              <option key={p.id} value={p.id}>{p.onSale?.name ?? p.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sub-state" className="text-xs text-muted-foreground">Trạng thái</label>
          <select id="sub-state" className={inputClassName} value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {(Object.keys(STATE) as SubscriptionState[]).filter((s) => s !== "FREE").map((s) => (
              <option key={s} value={s}>{STATE[s].label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">Lọc</Button>
        {filtered && (
          <Button type="button" variant="ghost" onClick={() => { setQ(""); setSearch(""); setPlanId(""); setState(""); setPage(1); }}>
            Xoá bộ lọc
          </Button>
        )}
        {data && <span className="ml-auto text-sm text-muted-foreground">{data.total.toLocaleString("vi-VN")} người đăng ký</span>}
      </form>

      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Người dùng</th>
              <th className="px-3 py-2 font-medium">Gói</th>
              <th className="px-3 py-2 text-right font-medium">Giá hợp đồng</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Đã trả đến</th>
              <th className="px-3 py-2 text-right font-medium">Nhóm sở hữu</th>
              <th className="px-3 py-2 text-right font-medium">Tổng đã trả</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && (
              <tr><td colSpan={7} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Không có người đăng ký phù hợp.</td></tr>
            )}
            {data?.items.map((s) => (
              <tr key={s.id} className="cursor-pointer border-t transition-colors duration-150 hover:bg-muted/50" onClick={() => trace.openUser(s.user.id)}>
                <td className="px-3 py-2">
                  <span className="block font-medium text-primary">{s.user.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.user.email}</span>
                </td>
                <td className="px-3 py-2">
                  <span className="block font-medium">{s.planName}</span>
                  <span className="block text-xs text-muted-foreground">Theo {s.billingCycle === "year" ? "năm" : "tháng"} · từ {formatVnDate(s.createdAt)}</span>
                </td>
                <td className="px-3 py-2 text-right">{formatVnd(s.priceVnd)}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={STATE[s.state].tone}>{STATE[s.state].label}</StatusBadge>
                  {s.overLimitSince && (() => {
                    const o = overage?.find((x) => x.user.id === s.user.id);
                    return (
                      <span className="mt-1 block text-xs text-destructive" title="Đang dùng nhiều nhóm, thành viên hoặc dung lượng hơn gói cho phép. Mở chi tiết để xem nhóm nào và vì sao.">
                        Vượt hạn mức · {o ? STAGE_LABEL[o.stage].label.toLowerCase() : `từ ${formatVnDate(s.overLimitSince)}`}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{s.paidThrough ? formatVnDate(s.paidThrough) : "—"}</td>
                <td className="px-3 py-2 text-right">{s.ownedGroups}</td>
                <td className="px-3 py-2 text-right">{formatVnd(s.lifetimeValueVnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.total > data.limit && (
          <div className="border-t px-3 py-2">
            <ServerPagination page={data.page} total={data.total} pageSize={data.limit} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Chủ nhóm đang vượt hạn mức</h3>
          <InfoHint text="Gồm cả tài khoản Free. Vượt hạn mức = sở hữu nhiều nhóm, nhóm nhiều thành viên hoặc dùng nhiều dung lượng hơn gói đang áp dụng. Các nhóm vượt hạn mức đi qua: cảnh báo → chỉ đọc → tạm ẩn với thành viên; không xoá dữ liệu." />
          <span className="ml-auto text-xs text-muted-foreground">{overage?.length ?? 0} chủ nhóm · bấm để xem nhóm nào bị ảnh hưởng</span>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Chủ nhóm</th>
              <th className="px-3 py-2 font-medium">Giai đoạn</th>
              <th className="px-3 py-2 font-medium">Phát hiện</th>
              <th className="px-3 py-2 font-medium">Chỉ đọc từ</th>
              <th className="px-3 py-2 font-medium">Tạm ẩn từ</th>
              <th className="px-3 py-2 text-right font-medium">Nhóm sở hữu</th>
            </tr>
          </thead>
          <tbody>
            {overage?.map((o) => (
              <tr key={o.user.id} className="cursor-pointer border-t hover:bg-muted/50" onClick={() => trace.openUser(o.user.id)}>
                <td className="px-3 py-2">
                  <TraceLink onClick={() => trace.openUser(o.user.id)}>{o.user.name}</TraceLink>
                  <span className="block text-xs text-muted-foreground">{o.user.email}</span>
                </td>
                <td className="px-3 py-2"><StatusBadge tone={STAGE_LABEL[o.stage].tone}>{STAGE_LABEL[o.stage].label}</StatusBadge></td>
                <td className="px-3 py-2 text-muted-foreground">{formatVnDate(o.overSince, true)}</td>
                <td className="px-3 py-2">{formatVnDate(o.readOnlyAt)}</td>
                <td className="px-3 py-2">{formatVnDate(o.hiddenAt)}</td>
                <td className="px-3 py-2 text-right">{o.ownedGroups}</td>
              </tr>
            ))}
            {overage?.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Không có chủ nhóm nào vượt hạn mức.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
