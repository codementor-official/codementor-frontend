"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, Field, ReasonButton, ServerPagination, SideDrawer, StatusBadge, useToast, useUrlState } from "@codementor/ui";
import { formatBytes, formatLimit, formatVnDate, formatVnd, toBytes } from "@codementor/utils";
import type { AdminPlan, BillingPage, Entitlements, SubscriberDetail, SubscriberRow, SubscriptionState } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";

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
  const [open, setOpen] = useState<string | null>(null);

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
  }, [request]);

  return (
    <div className="space-y-3">
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
      </form>

      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Người dùng</th>
              <th className="px-3 py-2 font-medium">Gói</th>
              <th className="px-3 py-2 font-medium">Giá hợp đồng</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Đến</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && (
              <tr><td colSpan={5} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Không có người đăng ký phù hợp.</td></tr>
            )}
            {data?.items.map((s) => (
              <tr key={s.id} className="cursor-pointer border-t transition-colors duration-150 hover:bg-muted/50" onClick={() => setOpen(s.user.id)}>
                <td className="px-3 py-2">
                  <button type="button" className="text-left" onClick={() => setOpen(s.user.id)}>
                    <span className="block font-medium">{s.user.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.user.email}</span>
                  </button>
                </td>
                <td className="px-3 py-2">{s.planName} · {s.billingCycle === "year" ? "năm" : "tháng"}</td>
                <td className="px-3 py-2">{formatVnd(s.priceVnd)}</td>
                <td className="px-3 py-2"><StatusBadge tone={STATE[s.state].tone}>{STATE[s.state].label}</StatusBadge></td>
                <td className="px-3 py-2 text-muted-foreground">{s.paidThrough ? formatVnDate(s.paidThrough) : "—"}</td>
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

      {open && <SubscriberDrawer userId={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function SubscriberDrawer({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const request = useAdminApi();
  const toast = useToast();
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const load = useCallback(() => plansApi.subscriber(request, userId).then(setDetail).catch((e) => toast.error(apiErrorMessage(e))), [request, userId, toast]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = async (work: () => Promise<unknown>, done: string) => {
    try {
      await work();
      toast.success(done);
      await load();
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const open = detail?.subscriptions.find((s) => !s.endedAt);
  return (
    <SideDrawer open onClose={onClose} width="wide" title={detail?.user.name ?? "Người đăng ký"} description={detail?.user.email}>
      {!detail ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" aria-hidden />
      ) : (
        <div className="space-y-5 text-sm">
          <section className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={STATE[detail.state].tone}>{STATE[detail.state].label}</StatusBadge>
            <span>Hạn mức đang áp dụng: <strong>{detail.effective?.planName}</strong> ({detail.effective?.source})</span>
            {open && (
              open.suspendedAt ? (
                <ReasonButton size="sm" variant="outline" title="Khôi phục gói?" description="Quyền lợi đã mua được áp dụng lại ngay. Ghi lý do để lưu vào nhật ký."
                  onConfirm={(reason) => act(() => plansApi.restore(request, userId, reason), "Đã khôi phục gói")}>
                  Khôi phục
                </ReasonButton>
              ) : (
                <ReasonButton size="sm" variant="danger" title="Tạm ngưng gói?" description="Tài khoản dùng hạn mức Free cho đến khi khôi phục. Dữ liệu và quyền lợi đã mua không bị sửa."
                  onConfirm={(reason) => act(() => plansApi.suspend(request, userId, reason), "Đã tạm ngưng gói")}>
                  Tạm ngưng
                </ReasonButton>
              )
            )}
          </section>

          {detail.effective && <Limits title="Hạn mức hiệu lực (gồm điều chỉnh)" e={detail.effective.entitlements} />}

          <section>
            <h3 className="mb-2 font-semibold">Các gói đã mua</h3>
            {detail.subscriptions.length === 0 && <p className="text-muted-foreground">Chưa mua gói nào.</p>}
            <ul className="space-y-3">
              {detail.subscriptions.map((s) => (
                <li key={s.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {s.planName} · {s.billingCycle === "year" ? "năm" : "tháng"} · {formatVnd(s.priceVnd)}
                    {s.endedAt && <span className="ml-2 text-xs text-muted-foreground">kết thúc {formatVnDate(s.endedAt)} ({s.endReason})</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Điều khoản {s.termsVersion} · snapshot bất biến</p>
                  <Limits e={s.entitlements} />
                  <ul className="mt-2 text-xs text-muted-foreground">
                    {s.terms.map((t) => (
                      <li key={t.orderId}>Kỳ {formatVnDate(t.startsAt)} – {formatVnDate(t.endsAt)}</li>
                    ))}
                  </ul>
                  {s.suspendedReason && <p className="mt-1 text-xs text-destructive">Tạm ngưng: {s.suspendedReason}</p>}
                </li>
              ))}
            </ul>
          </section>

          <Adjustments detail={detail} userId={userId} act={act} />

          <section>
            <h3 className="mb-2 font-semibold">Giao dịch</h3>
            <ul className="divide-y rounded-md border">
              {detail.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="text-muted-foreground">{formatVnDate(o.createdAt, true)}</span>
                  <span>{o.kind} · {o.planName}</span>
                  <span className="ml-auto font-medium">{formatVnd(o.amountVnd)}</span>
                  <StatusBadge tone={o.status === "paid" ? "success" : o.status === "review" ? "warning" : "neutral"}>{o.status}</StatusBadge>
                </li>
              ))}
              {detail.orders.length === 0 && <li className="px-3 py-2 text-muted-foreground">Không có giao dịch.</li>}
            </ul>
          </section>
        </div>
      )}
    </SideDrawer>
  );
}

function Limits({ e, title }: { e: Entitlements; title?: string }) {
  return (
    <div className="mt-2">
      {title && <h3 className="mb-1 font-semibold">{title}</h3>}
      <p className="text-xs text-muted-foreground">
        {formatLimit(e.maxOwnedGroups)} nhóm · {formatLimit(e.maxMembersPerGroup)} TV/nhóm · {formatBytes(e.maxStorageBytes)} · tệp{" "}
        {formatBytes(e.maxUploadBytes)} · {formatLimit(e.monthlyAiRequests)} lượt AI
      </p>
    </div>
  );
}

const ENTITLEMENTS = [
  { value: "max_owned_groups", label: "Nhóm sở hữu", bytes: false },
  { value: "max_members_per_group", label: "Thành viên mỗi nhóm", bytes: false },
  { value: "max_storage_bytes", label: "Dung lượng (GB)", bytes: true },
  { value: "max_upload_bytes", label: "Tệp tối đa (MB)", bytes: true },
  { value: "monthly_ai_requests", label: "Lượt AI / tháng", bytes: false },
] as const;

/** Exceptional grants: added on top of the purchase, time-boxed, reasoned and audited. */
function Adjustments({ detail, userId, act }: { detail: SubscriberDetail; userId: string; act: (w: () => Promise<unknown>, done: string) => Promise<void> }) {
  const request = useAdminApi();
  const [entitlement, setEntitlement] = useState<(typeof ENTITLEMENTS)[number]["value"]>("max_storage_bytes");
  const [amount, setAmount] = useState("1");
  const [endsAt, setEndsAt] = useState("");
  const kind = ENTITLEMENTS.find((x) => x.value === entitlement)!;
  const value =
    entitlement === "max_storage_bytes" ? toBytes(Number(amount), "GB") : entitlement === "max_upload_bytes" ? toBytes(Number(amount), "MB") : Number(amount);
  const valid = Number.isFinite(value) && value > 0 && !!endsAt;
  return (
    <section>
      <h3 className="mb-2 font-semibold">Điều chỉnh ngoại lệ</h3>
      <ul className="mb-3 space-y-1">
        {detail.adjustments.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
            <span className="font-medium">+{String(a.amount)} {a.entitlement}</span>
            <span className="text-xs text-muted-foreground">
              {formatVnDate(a.starts_at)} – {formatVnDate(a.ends_at)} · {a.created_by_name}: {a.reason}
            </span>
            {a.revoked_at ? (
              <StatusBadge>Đã thu hồi</StatusBadge>
            ) : (
              <ReasonButton size="sm" variant="ghost" className="ml-auto" title="Thu hồi điều chỉnh?" description="Hạn mức cộng thêm sẽ không còn áp dụng."
                onConfirm={(reason) => act(() => plansApi.revokeAdjustment(request, a.id, reason), "Đã thu hồi")}>
                Thu hồi
              </ReasonButton>
            )}
          </li>
        ))}
        {detail.adjustments.length === 0 && <li className="text-muted-foreground">Chưa có điều chỉnh.</li>}
      </ul>
      <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
        <Field label="Hạn mức" htmlFor="adj-kind">
          <select id="adj-kind" className={inputClassName} value={entitlement} onChange={(e) => setEntitlement(e.target.value as typeof entitlement)}>
            {ENTITLEMENTS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </Field>
        <Field label={`Cộng thêm${kind.bytes ? "" : " (số)"}`} htmlFor="adj-amount">
          <input id="adj-amount" className={inputClassName} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
        </Field>
        <Field label="Hết hiệu lực" htmlFor="adj-end">
          <input id="adj-end" type="date" className={inputClassName} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
        <div className="sm:col-span-3">
          <ReasonButton size="sm" variant="outline" disabled={!valid} title="Thêm điều chỉnh?" description="Điều chỉnh cộng thêm vào hạn mức đã mua, có thời hạn, và được ghi vào nhật ký. Gói đã mua không bị sửa."
            onConfirm={(reason) => act(() => plansApi.addAdjustment(request, userId, { entitlement, amount: value, endsAt: new Date(`${endsAt}T23:59:59+07:00`).toISOString(), reason }), "Đã thêm điều chỉnh")}>
            Thêm điều chỉnh
          </ReasonButton>
        </div>
      </div>
    </section>
  );
}
