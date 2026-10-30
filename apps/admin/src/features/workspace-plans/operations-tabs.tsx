"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarClock, Eye, EyeOff, Lock, ShieldCheck, TicketPercent } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, ConfirmButton, Field, Modal, ServerPagination, StatusBadge, useToast, useUrlState } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, AuditCategory, AuditEntry, BillingCycle, BillingPage, BillingSettings, SubscriberStats, WorkspaceCoupon, WorkspaceOrder } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi, type CouponInput } from "./api";
import { actionLabel } from "./overview-tab";
import { AuditSubject, TraceLink, useTrace } from "./trace";

export const ORDER_TONE: Record<WorkspaceOrder["status"], "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
  expired: "neutral",
  review: "warning",
  refunded: "neutral",
};
export const ORDER_LABEL: Record<WorkspaceOrder["status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã huỷ",
  expired: "Hết hạn",
  review: "Cần kiểm tra",
  refunded: "Đã hoàn",
};
export const KIND: Record<WorkspaceOrder["kind"], string> = { new: "Mua mới", renewal: "Gia hạn", upgrade: "Nâng cấp" };

export function OrdersTab() {
  const request = useAdminApi();
  const trace = useTrace();
  const [page, setPage] = useUrlState("oPage", 1);
  const [status, setStatus] = useUrlState("oStatus", "");
  const [q, setQ] = useUrlState("oQ", "");
  const [search, setSearch] = useState(q);
  const [data, setData] = useState<BillingPage<WorkspaceOrder & { buyer: { id: string; name: string; email: string } }> | null>(null);
  const [error, setError] = useState("");
  // Reload after the order drawer closes: a reconcile or refund changes the row.
  const [openOrder] = useUrlState("order", "");
  useEffect(() => {
    if (openOrder) return;
    plansApi
      .orders(request, { page, status: status || undefined, q: q || undefined })
      .then((d) => {
        setError("");
        setData(d);
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [request, page, status, q, openOrder]);

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
          <label htmlFor="o-q" className="text-xs text-muted-foreground">Người mua (tên hoặc email)</label>
          <input id="o-q" className={`${inputClassName} w-64`} value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label htmlFor="o-status" className="text-xs text-muted-foreground">Trạng thái</label>
          <select id="o-status" className={inputClassName} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {Object.entries(ORDER_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Button type="submit" variant="outline">Lọc</Button>
        {(q || status) && <Button type="button" variant="ghost" onClick={() => { setQ(""); setSearch(""); setStatus(""); setPage(1); }}>Xoá bộ lọc</Button>}
        {data && <span className="ml-auto text-sm text-muted-foreground">{data.total.toLocaleString("vi-VN")} giao dịch · bấm một dòng để xem chi tiết</span>}
      </form>
      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Thời gian</th>
              <th className="px-3 py-2 font-medium">Người mua</th>
              <th className="px-3 py-2 font-medium">Nội dung</th>
              <th className="px-3 py-2 text-right font-medium">Số tiền</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <tr><td colSpan={5} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {data?.items.map((o) => (
              <tr key={o.id} className="cursor-pointer border-t transition-colors duration-150 hover:bg-muted/50" onClick={() => trace.openOrder(o.id)}>
                <td className="px-3 py-2 text-muted-foreground">{formatVnDate(o.createdAt, true)}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <TraceLink onClick={() => trace.openUser(o.buyer.id)}>{o.buyer.name}</TraceLink>
                  <span className="block text-xs text-muted-foreground">{o.buyer.email}</span>
                </td>
                <td className="px-3 py-2">
                  {KIND[o.kind]} {o.planName} · {o.billingCycle === "year" ? "năm" : "tháng"}
                  {(o.discountVnd > 0 || o.creditVnd > 0) && (
                    <span className="block text-xs text-muted-foreground">
                      Giá {formatVnd(o.listPriceVnd)}
                      {o.discountVnd > 0 && ` · giảm ${formatVnd(o.discountVnd)}${o.coupon ? ` (${o.coupon.code})` : ""}`}
                      {o.creditVnd > 0 && ` · trừ ${formatVnd(o.creditVnd)}`}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatVnd(o.amountVnd)}</td>
                <td className="px-3 py-2"><StatusBadge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</StatusBadge></td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Không có giao dịch.</td></tr>}
          </tbody>
        </table>
        {data && data.total > data.limit && (
          <div className="border-t px-3 py-2">
            <ServerPagination page={data.page} total={data.total} pageSize={data.limit} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}

type CouponStatus = { label: string; tone: "success" | "warning" | "danger" | "neutral" };

export function couponStatus(c: WorkspaceCoupon, now = Date.now()): CouponStatus {
  if (!c.is_active) return { label: "Đã tắt", tone: "neutral" };
  if (new Date(c.starts_at).getTime() > now) return { label: "Chưa bắt đầu", tone: "warning" };
  if (new Date(c.ends_at).getTime() <= now) return { label: "Đã hết hạn", tone: "neutral" };
  if (c.max_redemptions !== null && c.redeemed + c.reserved >= c.max_redemptions) return { label: "Hết lượt", tone: "danger" };
  return { label: "Đang áp dụng", tone: "success" };
}

export function CouponsTab() {
  const request = useAdminApi();
  const toast = useToast();
  const trace = useTrace();
  const [coupons, setCoupons] = useState<WorkspaceCoupon[] | null>(null);
  // Reload after the detail drawer closes: it may have edited or switched a coupon.
  const [openCoupon] = useUrlState("coupon", "");
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [creating, setCreating] = useState(false);
  const load = useCallback(() => plansApi.coupons(request).then(setCoupons).catch((e) => toast.error(apiErrorMessage(e))), [request, toast]);
  useEffect(() => {
    if (!openCoupon) void load();
  }, [load, openCoupon]);
  useEffect(() => {
    plansApi.plans(request).then(setPlans).catch(() => setPlans([]));
  }, [request]);

  const planName = (id: string) => plans.find((p) => p.id === id)?.onSale?.name ?? "gói đã xoá";
  const live = coupons?.filter((c) => couponStatus(c).label === "Đang áp dụng").length ?? 0;
  const redeemed = coupons?.reduce((sum, c) => sum + c.redeemed, 0) ?? 0;

  async function toggle(c: WorkspaceCoupon) {
    try {
      await plansApi.setCouponActive(request, c.id, !c.is_active);
      toast.success(c.is_active ? `Đã tắt mã ${c.code}` : `Đã bật lại mã ${c.code}`);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <TicketPercent className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-lg font-semibold leading-tight">{live} <span className="text-sm font-normal text-muted-foreground">/ {coupons?.length ?? 0} mã đang áp dụng</span></p>
            <p className="text-xs text-muted-foreground">{redeemed} lượt đã dùng · bấm một mã để xem chi tiết và sửa</p>
          </div>
        </Card>
        <p className="max-w-xl flex-1 text-sm text-muted-foreground">
          Mã giảm giá áp dụng cho đơn mua mới và nâng cấp. Đơn đã dùng mã giữ nguyên giá kể cả khi mã bị tắt.
        </p>
        <Button onClick={() => setCreating(true)}>Tạo mã giảm giá</Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Mã</th>
              <th className="px-3 py-2 font-medium">Mức giảm</th>
              <th className="px-3 py-2 font-medium">Phạm vi</th>
              <th className="px-3 py-2 font-medium">Hiệu lực</th>
              <th className="px-3 py-2 font-medium">Đã dùng</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {coupons === null && <tr><td colSpan={7} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {coupons?.map((c) => {
              const status = couponStatus(c);
              const scope = [
                c.plan_ids?.length ? c.plan_ids.map(planName).join(", ") : "Mọi gói",
                c.billing_cycles?.length ? c.billing_cycles.map((x) => (x === "month" ? "tháng" : "năm")).join(", ") : null,
                c.new_customers_only ? "chỉ khách mới" : null,
              ].filter(Boolean);
              const used = c.redeemed + c.reserved;
              return (
                <tr key={c.id} className="cursor-pointer border-t align-top transition-colors duration-150 hover:bg-muted/50" onClick={() => trace.openCoupon(c.id)}>
                  <td className="px-3 py-2">
                    <span className="font-mono font-semibold">{c.code}</span>
                    {c.description && <span className="block max-w-56 text-xs text-muted-foreground">{c.description}</span>}
                  </td>
                  <td className="px-3 py-2 font-medium">{c.kind === "percent" ? `−${c.value}%` : `−${formatVnd(c.value)}`}</td>
                  <td className="px-3 py-2 text-xs">{scope.join(" · ")}<span className="block text-muted-foreground">{c.per_user_limit} lượt/người</span></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatVnDate(c.starts_at)}<span className="block">đến {formatVnDate(c.ends_at)}</span></td>
                  <td className="w-40 px-3 py-2">
                    <span className="text-xs">{c.redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : " lượt"}{c.reserved > 0 && ` (+${c.reserved} đang giữ)`}</span>
                    {c.max_redemptions && (
                      <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
                        <div className="h-1.5 rounded-full bg-chart-1" style={{ width: `${Math.min(100, (used / c.max_redemptions) * 100)}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <ConfirmButton
                      size="sm"
                      variant={c.is_active ? "danger" : "default"}
                      title={c.is_active ? `Tắt mã ${c.code}?` : `Bật lại mã ${c.code}?`}
                      description={c.is_active ? "Mã không dùng được cho đơn mới. Đơn đã áp mã giữ nguyên giá." : "Mã dùng lại được trong thời gian hiệu lực và số lượt còn lại."}
                      onConfirm={() => toggle(c)}
                    >
                      {c.is_active ? "Tắt" : "Bật lại"}
                    </ConfirmButton>
                  </td>
                </tr>
              );
            })}
            {coupons?.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Chưa có mã giảm giá.</td></tr>}
          </tbody>
        </table>
      </Card>
      {creating && <CouponDialog plans={plans} onClose={() => setCreating(false)} onCreated={async () => { setCreating(false); await load(); }} />}
    </div>
  );
}

function CouponDialog({ plans, onClose, onCreated }: { plans: AdminPlan[]; onClose: () => void; onCreated: () => Promise<void> }) {
  const request = useAdminApi();
  const toast = useToast();
  const [f, setF] = useState({ description: "", code: "", kind: "percent" as "percent" | "fixed", value: "10", startsAt: "", endsAt: "", max: "", perUser: "1", planIds: [] as string[], cycles: [] as BillingCycle[], newOnly: false });
  const [error, setError] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit() {
    const value = Number(f.value);
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(f.code)) return setError("Mã 3–32 ký tự: chữ, số, gạch dưới, gạch ngang.");
    if (!(value > 0) || (f.kind === "percent" && value > 100)) return setError("Giá trị giảm không hợp lệ.");
    if (!f.startsAt || !f.endsAt || f.endsAt <= f.startsAt) return setError("Chọn thời gian bắt đầu và kết thúc hợp lệ.");
    const body: CouponInput = {
      code: f.code,
      kind: f.kind,
      value,
      startsAt: new Date(f.startsAt).toISOString(),
      endsAt: new Date(f.endsAt).toISOString(),
      ...(f.max ? { maxRedemptions: Number(f.max) } : {}),
      perUserLimit: Number(f.perUser) || 1,
      ...(f.planIds.length ? { planIds: f.planIds } : {}),
      ...(f.cycles.length ? { billingCycles: f.cycles } : {}),
      newCustomersOnly: f.newOnly,
      description: f.description.trim(),
    };
    try {
      await plansApi.createCoupon(request, body);
      toast.success(`Đã tạo mã ${f.code}`);
      await onCreated();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <Modal open onClose={onClose} title="Tạo mã giảm giá" width="md"
      footer={<><Button variant="outline" onClick={onClose}>Huỷ</Button><Button onClick={submit}>Tạo mã</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mã" htmlFor="c-code" hint="Người mua nhập mã này ở bước thanh toán, ví dụ LAUNCH20."><input id="c-code" className={inputClassName} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
        <Field label="Mục đích" htmlFor="c-desc" hint="Giúp quản trị viên khác hiểu mã này dùng để làm gì.">
          <input id="c-desc" className={inputClassName} maxLength={200} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="vd. Ưu đãi ra mắt" />
        </Field>
        <Field label="Kiểu giảm" htmlFor="c-kind">
          <select id="c-kind" className={inputClassName} value={f.kind} onChange={(e) => set("kind", e.target.value as "percent" | "fixed")}>
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền cố định (₫)</option>
          </select>
        </Field>
        <Field label={f.kind === "percent" ? "Giảm (%)" : "Giảm (₫)"} htmlFor="c-value"><input id="c-value" className={inputClassName} inputMode="numeric" value={f.value} onChange={(e) => set("value", e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Tổng lượt dùng (trống = không giới hạn)" htmlFor="c-max"><input id="c-max" className={inputClassName} inputMode="numeric" value={f.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="Bắt đầu" htmlFor="c-start"><input id="c-start" type="datetime-local" className={inputClassName} value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
        <Field label="Kết thúc" htmlFor="c-end"><input id="c-end" type="datetime-local" className={inputClassName} value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
        <Field label="Lượt mỗi người" htmlFor="c-per" hint="Một tài khoản dùng được tối đa bao nhiêu lần."><input id="c-per" className={inputClassName} inputMode="numeric" value={f.perUser} onChange={(e) => set("perUser", e.target.value.replace(/\D/g, ""))} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.newOnly} onChange={(e) => set("newOnly", e.target.checked)} /> Chỉ khách mua lần đầu</label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Phạm vi áp dụng (bỏ trống = mọi gói, mọi chu kỳ)</legend>
          <div className="flex flex-wrap gap-3">
            {plans.filter((p) => !p.isDefault).map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.planIds.includes(p.id)} onChange={() => set("planIds", toggle(f.planIds, p.id))} /> {p.onSale?.name ?? p.code}</label>
            ))}
            {(["month", "year"] as const).map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.cycles.includes(c)} onChange={() => set("cycles", toggle(f.cycles, c))} /> {c === "month" ? "Theo tháng" : "Theo năm"}</label>
            ))}
          </div>
        </fieldset>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
          Mã chỉ áp dụng cho đơn mua mới và nâng cấp, không áp dụng cho gia hạn. Số tiền phải trả sau giảm không thấp hơn 5.000 ₫. Mã đã tạo không sửa được; chỉ bật hoặc tắt.
        </p>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}

type SettingsForm = Record<"graceDays" | "renewalReminderDays" | "overageNoticeDays" | "overageReadOnlyDays", string>;
const SETTING_RANGE: Record<keyof SettingsForm, [number, number]> = {
  graceDays: [0, 30],
  renewalReminderDays: [1, 30],
  overageNoticeDays: [0, 60],
  overageReadOnlyDays: [1, 365],
};

export function SettingsTab() {
  const request = useAdminApi();
  const toast = useToast();
  const trace = useTrace();
  const [saved, setSaved] = useState<BillingSettings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const apply = useCallback((v: BillingSettings) => {
    setSaved(v);
    setForm({
      graceDays: String(v.graceDays),
      renewalReminderDays: String(v.renewalReminderDays),
      overageNoticeDays: String(v.overageNoticeDays),
      overageReadOnlyDays: String(v.overageReadOnlyDays),
    });
  }, []);
  useEffect(() => {
    plansApi.settings(request).then(apply).catch((e) => toast.error(apiErrorMessage(e)));
    plansApi.subscriberStats(request).then(setStats).catch(() => setStats(null));
  }, [request, toast, apply]);
  if (!form || !saved) return <Card className="h-64 animate-pulse" aria-hidden />;

  const n = (k: keyof SettingsForm) => Number(form[k] || 0);
  const invalid = (Object.keys(SETTING_RANGE) as (keyof SettingsForm)[]).filter((k) => form[k] === "" || n(k) < SETTING_RANGE[k][0] || n(k) > SETTING_RANGE[k][1]);
  const dirty = (Object.keys(form) as (keyof SettingsForm)[]).some((k) => n(k) !== saved[k]);
  const grace = stats?.byState.find((x) => x.state === "GRACE_PERIOD")?.count ?? 0;
  const over = stats?.overLimitOwners;
  const day = (d: number) => (d === 0 ? "Ngày hết kỳ" : `Ngày ${d} sau khi hết kỳ`);

  const steps: { icon: typeof BellRing; when: string; title: string; body: string; field?: keyof SettingsForm; unit?: string; affected?: { count: number; label: string; go: () => void } }[] = [
    { icon: BellRing, when: `${n("renewalReminderDays")} ngày trước khi hết kỳ`, title: "Nhắc gia hạn", body: "Chủ nhóm nhận thông báo nhắc gia hạn. Gói không tự trừ tiền.", field: "renewalReminderDays", unit: "ngày trước" },
    { icon: ShieldCheck, when: day(0), title: "Ân hạn", body: "Chưa gia hạn vẫn giữ nguyên hạn mức và tính năng của gói trong số ngày này.", field: "graceDays", unit: "ngày", affected: { count: grace, label: "tài khoản đang ân hạn", go: () => trace.goTab("subscribers", { sState: "GRACE_PERIOD" }) } },
    { icon: CalendarClock, when: day(n("graceDays")), title: "Về hạn mức Free · cảnh báo", body: "Nếu đang vượt hạn mức Free: mọi thứ vẫn hoạt động, chủ nhóm được báo trước ngày khoá.", field: "overageNoticeDays", unit: "ngày cảnh báo", affected: over && { count: over.notice, label: "chủ nhóm đang được cảnh báo", go: () => trace.goTab("subscribers") } },
    { icon: Lock, when: day(n("graceDays") + n("overageNoticeDays")), title: "Chỉ đọc", body: "Nhóm vượt hạn mức: xem, tải tài liệu, làm bài đã giao, xoá bớt được; không tải lên, không tạo hay giao bài, không nhắn tin mới.", field: "overageReadOnlyDays", unit: "ngày chỉ đọc", affected: over && { count: over.readOnly, label: "chủ nhóm có nhóm chỉ đọc", go: () => trace.goTab("subscribers") } },
    { icon: EyeOff, when: day(n("graceDays") + n("overageNoticeDays") + n("overageReadOnlyDays")), title: "Tạm ẩn", body: "Thành viên không mở được nhóm; chủ nhóm vẫn vào để dọn dẹp. Không có dữ liệu nào bị xoá.", affected: over && { count: over.hidden, label: "chủ nhóm có nhóm tạm ẩn", go: () => trace.goTab("subscribers") } },
    { icon: Eye, when: "Bất kỳ lúc nào", title: "Mở lại ngay", body: "Gia hạn, nâng cấp, xoá bớt thành viên/tài liệu hoặc chuyển nhóm cho người khác." },
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Chính sách gia hạn và vượt hạn mức</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Toàn bộ những gì xảy ra với một chủ nhóm không gia hạn, theo thứ tự. Sửa số ngày ngay trong từng bước; mốc thời gian
            tính lại khi bạn gõ. Chỉ nhóm vượt hạn mức Free bị ảnh hưởng: nhóm ngoài số nhóm được giữ (giữ nhóm hoạt động gần nhất),
            nhóm quá số thành viên, hoặc mọi nhóm nếu vượt dung lượng.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Cập nhật {formatVnDate(saved.updatedAt, true)}{saved.updatedBy ? ` bởi ${saved.updatedBy}` : ""}
          <br />Điều khoản {saved.termsVersion}
        </p>
      </div>

      <ol className="mt-5 space-y-0">
        {steps.map((step, i) => (
          <li key={step.title} className="relative grid gap-3 pb-5 pl-10 last:pb-0 md:grid-cols-[minmax(0,1fr)_200px_220px] md:items-start">
            {i < steps.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-border" aria-hidden />}
            <span className="absolute top-0 left-0 flex size-8 items-center justify-center rounded-full border bg-background"><step.icon className="size-4" aria-hidden /></span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{step.when}</p>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
            <div>
              {step.field && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    className={`${inputClassName} w-20! text-right`}
                    inputMode="numeric"
                    aria-label={`${step.title}: số ${step.unit}`}
                    aria-invalid={invalid.includes(step.field)}
                    value={form[step.field]}
                    onChange={(e) => setForm({ ...form, [step.field!]: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  />
                  <span className="text-muted-foreground">{step.unit}</span>
                </label>
              )}
              {step.field && (
                <p className={`mt-1 text-xs ${invalid.includes(step.field) ? "text-destructive" : "text-muted-foreground"}`}>
                  Cho phép {SETTING_RANGE[step.field][0]}–{SETTING_RANGE[step.field][1]}
                </p>
              )}
            </div>
            <div className="text-sm">
              {step.affected && (
                <button type="button" className="rounded-md border px-3 py-1.5 text-left hover:bg-muted" onClick={step.affected.go}>
                  <span className="font-semibold">{step.affected.count}</span> <span className="text-muted-foreground">{step.affected.label} →</span>
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
        <ConfirmButton
          variant="default"
          disabled={!dirty || invalid.length > 0}
          title="Lưu chính sách Workspace?"
          description="Áp dụng ngay cho mọi tài khoản, kể cả tài khoản đang ân hạn hoặc đang vượt hạn mức: ngày khoá và ngày ẩn được tính lại theo số ngày mới."
          onConfirm={async () => {
            try {
              apply(await plansApi.updateSettings(request, {
                graceDays: n("graceDays"),
                renewalReminderDays: n("renewalReminderDays"),
                overageNoticeDays: n("overageNoticeDays"),
                overageReadOnlyDays: n("overageReadOnlyDays"),
              }));
              toast.success("Đã lưu chính sách");
            } catch (e) {
              toast.error(apiErrorMessage(e));
            }
          }}
        >
          Lưu thay đổi
        </ConfirmButton>
        {dirty && <Button variant="ghost" onClick={() => apply(saved)}>Hoàn tác</Button>}
        {dirty && <span className="text-xs text-muted-foreground">Có thay đổi chưa lưu.</span>}
      </div>
    </Card>
  );
}

const AUDIT_CATEGORIES: { value: AuditCategory | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "subscription", label: "Gói của khách" },
  { value: "order", label: "Đơn hàng" },
  { value: "payment", label: "Thanh toán" },
  { value: "plan", label: "Bảng giá" },
  { value: "coupon", label: "Mã giảm giá" },
  { value: "adjustment", label: "Hạn mức ngoại lệ" },
  { value: "settings", label: "Cài đặt" },
];

const DETAIL_LABEL: Record<string, string> = {
  reason: "Lý do",
  description: "Mục đích",
  maxRedemptions: "Tổng lượt",
  perUserLimit: "Lượt mỗi người",
  startsAt: "Bắt đầu",
  amountVnd: "Số tiền",
  amount: "Mức",
  gatewayReference: "Mã cổng thanh toán",
  paidThrough: "Kỳ đến",
  overSince: "Vượt hạn mức từ",
  stage: "Giai đoạn",
  code: "Mã",
  kind: "Loại",
  value: "Giá trị",
  version: "Phiên bản",
  availableFrom: "Áp dụng từ",
  entitlement: "Hạn mức",
  endsAt: "Đến",
  graceDays: "Ân hạn (ngày)",
  renewalReminderDays: "Nhắc trước (ngày)",
  overageNoticeDays: "Cảnh báo (ngày)",
  overageReadOnlyDays: "Chỉ đọc (ngày)",
};
const STAGE_LABEL: Record<string, string> = { notice: "cảnh báo", read_only: "chỉ đọc", hidden: "tạm ẩn" };

const VALUE_LABEL: Record<string, string> = {
  percent: "phần trăm",
  fixed: "số tiền",
  new: "mua mới",
  renewal: "gia hạn",
  upgrade: "nâng cấp",
  month: "tháng",
  year: "năm",
  ...STAGE_LABEL,
};

function auditValue(key: string, value: unknown, d: Record<string, unknown>): string {
  if (value === null || value === undefined) return "—";
  if (/Vnd$/.test(key) || (key === "value" && d.kind === "fixed")) return formatVnd(Number(value));
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatVnDate(value, true);
  if (typeof value === "string" && VALUE_LABEL[value]) return VALUE_LABEL[value];
  return String(value);
}

/** The readable part of an entry: known scalar fields, and for settings what changed. */
function auditSummary(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];
  const d = details as Record<string, unknown>;
  if (d.before && d.after && typeof d.before === "object" && typeof d.after === "object") {
    const before = d.before as Record<string, unknown>;
    return Object.entries(d.after as Record<string, unknown>)
      .filter(([k, v]) => before[k] !== v && DETAIL_LABEL[k])
      .map(([k, v]) => `${DETAIL_LABEL[k]}: ${auditValue(k, before[k], before)} → ${auditValue(k, v, d.after as Record<string, unknown>)}`);
  }
  return Object.entries(d)
    .filter(([k, v]) => DETAIL_LABEL[k] && v !== null && typeof v !== "object")
    .map(([k, v]) => `${DETAIL_LABEL[k]}: ${auditValue(k, v, d)}`);
}

export function AuditTab() {
  const request = useAdminApi();
  const [page, setPage] = useUrlState("aPage", 1);
  const [category, setCategory] = useUrlState<AuditCategory | "">("aCat", "");
  const [data, setData] = useState<BillingPage<AuditEntry> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    plansApi
      .audit(request, { page, limit: 20, category: category || undefined })
      .then((d) => {
        setError("");
        setData(d);
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [request, page, category]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc nhật ký">
        {AUDIT_CATEGORIES.map((c) => (
          <Button key={c.value} size="sm" variant={category === c.value ? "default" : "outline"} aria-pressed={category === c.value}
            onClick={() => { setCategory(c.value); setPage(1); }}>
            {c.label}
          </Button>
        ))}
        {data && <span className="ml-auto text-sm text-muted-foreground">{data.total.toLocaleString("vi-VN")} mục</span>}
      </div>
      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-40 px-3 py-2 font-medium">Thời gian</th>
              <th className="px-3 py-2 font-medium">Sự kiện</th>
              <th className="px-3 py-2 font-medium">Đối tượng</th>
              <th className="px-3 py-2 font-medium">Người thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && <tr><td colSpan={4} className="px-3 py-6"><div className="h-4 animate-pulse rounded bg-muted" /></td></tr>}
            {data?.items.map((a) => {
              const summary = auditSummary(a.details);
              return (
                <tr key={a.id} className="border-t align-top">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatVnDate(a.created_at, true)}</td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{actionLabel(a.action)}</span>
                    {summary.length > 0 && <span className="mt-0.5 block text-xs text-muted-foreground">{summary.join(" · ")}</span>}
                    {a.details !== null && a.details !== undefined && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Dữ liệu gốc</summary>
                        <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(a.details, null, 2)}</pre>
                      </details>
                    )}
                  </td>
                  <td className="px-3 py-2"><AuditSubject entry={a} /></td>
                  <td className="px-3 py-2">{a.actor ?? <span className="text-muted-foreground">Hệ thống</span>}</td>
                </tr>
              );
            })}
            {data?.items.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Chưa có mục nào.</td></tr>}
          </tbody>
        </table>
        {data && data.total > data.limit && (
          <div className="border-t px-3 py-2">
            <ServerPagination page={data.page} total={data.total} pageSize={data.limit} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
