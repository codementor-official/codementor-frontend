"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarClock, Eye, EyeOff, Lock, RefreshCw, ShieldCheck, TicketPercent } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, ConfirmButton, Field, Modal, ReasonButton, ServerPagination, StatusBadge, useToast, useUrlState } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, AuditCategory, AuditEntry, BillingCycle, BillingPage, BillingSettings, WorkspaceCoupon, WorkspaceOrder } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi, type CouponInput } from "./api";
import { actionLabel } from "./overview-tab";

const ORDER_TONE: Record<WorkspaceOrder["status"], "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  cancelled: "neutral",
  expired: "neutral",
  review: "warning",
  refunded: "neutral",
};
const ORDER_LABEL: Record<WorkspaceOrder["status"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã huỷ",
  expired: "Hết hạn",
  review: "Cần kiểm tra",
  refunded: "Đã hoàn",
};
const KIND: Record<WorkspaceOrder["kind"], string> = { new: "Mua mới", renewal: "Gia hạn", upgrade: "Nâng cấp" };

export function OrdersTab() {
  const request = useAdminApi();
  const toast = useToast();
  const [page, setPage] = useUrlState("oPage", 1);
  const [status, setStatus] = useUrlState("oStatus", "");
  const [data, setData] = useState<BillingPage<WorkspaceOrder & { buyer: { name: string; email: string } }> | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      plansApi
        .orders(request, { page, status: status || undefined })
        .then((d) => {
          setError("");
          setData(d);
        })
        .catch((e) => setError(apiErrorMessage(e))),
    [request, page, status],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function reconcile(id: string) {
    try {
      const o = await plansApi.reconcile(request, id);
      toast.success(`Đã đối soát: ${ORDER_LABEL[o.status]}`);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div>
          <label htmlFor="o-status" className="text-xs text-muted-foreground">Trạng thái</label>
          <select id="o-status" className={inputClassName} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {Object.entries(ORDER_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {error && <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Thời gian</th>
              <th className="px-3 py-2 font-medium">Người mua</th>
              <th className="px-3 py-2 font-medium">Nội dung</th>
              <th className="px-3 py-2 text-right font-medium">Số tiền</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 text-muted-foreground">{formatVnDate(o.createdAt, true)}</td>
                <td className="px-3 py-2">
                  <span className="block font-medium">{o.buyer.name}</span>
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
                <td className="px-3 py-2 text-right">
                  {(o.status === "pending" || o.status === "review") && o.mode !== "mock" && (
                    <Button size="sm" variant="ghost" onClick={() => reconcile(o.id)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Đối soát
                    </Button>
                  )}
                  {(o.status === "paid" || o.status === "review") && (
                    <ReasonButton
                      size="sm"
                      variant="ghost"
                      title={`Ghi nhận hoàn ${formatVnd(o.amountVnd)}?`}
                      description="Chỉ ghi nhận sau khi đã hoàn tiền trên cổng thanh toán. Sổ cái được bù trừ; nếu kỳ của đơn chưa kết thúc, gói của người mua kết thúc ngay và tài khoản về Free (dữ liệu vẫn giữ). Ghi lý do và mã hoàn tiền của cổng."
                      placeholder="Lý do · mã hoàn tiền trên cổng (nếu có)"
                      onConfirm={async (reason) => {
                        try {
                          const r = await plansApi.refund(request, o.id, reason);
                          toast.success(r.endedSubscription ? "Đã ghi nhận hoàn tiền và kết thúc gói" : "Đã ghi nhận hoàn tiền");
                          await load();
                        } catch (e) {
                          toast.error(apiErrorMessage(e));
                        }
                      }}
                    >
                      Hoàn tiền
                    </ReasonButton>
                  )}
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Không có giao dịch.</td></tr>}
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

function couponStatus(c: WorkspaceCoupon, now = Date.now()): CouponStatus {
  if (!c.is_active) return { label: "Đã tắt", tone: "neutral" };
  if (new Date(c.starts_at).getTime() > now) return { label: "Chưa bắt đầu", tone: "warning" };
  if (new Date(c.ends_at).getTime() <= now) return { label: "Đã hết hạn", tone: "neutral" };
  if (c.max_redemptions !== null && c.redeemed + c.reserved >= c.max_redemptions) return { label: "Hết lượt", tone: "danger" };
  return { label: "Đang áp dụng", tone: "success" };
}

export function CouponsTab() {
  const request = useAdminApi();
  const toast = useToast();
  const [coupons, setCoupons] = useState<WorkspaceCoupon[] | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [creating, setCreating] = useState(false);
  const load = useCallback(() => plansApi.coupons(request).then(setCoupons).catch((e) => toast.error(apiErrorMessage(e))), [request, toast]);
  useEffect(() => {
    void load();
    plansApi.plans(request).then(setPlans).catch(() => setPlans([]));
  }, [load, request]);

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
            <p className="text-xs text-muted-foreground">{redeemed} lượt đã dùng</p>
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
                <tr key={c.id} className="border-t align-top">
                  <td className="px-3 py-2 font-mono font-semibold">{c.code}</td>
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
                  <td className="px-3 py-2 text-right">
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
  const [f, setF] = useState({ code: "", kind: "percent" as "percent" | "fixed", value: "10", startsAt: "", endsAt: "", max: "", perUser: "1", planIds: [] as string[], cycles: [] as BillingCycle[], newOnly: false });
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
  const [saved, setSaved] = useState<BillingSettings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const apply = useCallback((s: BillingSettings) => {
    setSaved(s);
    setForm({
      graceDays: String(s.graceDays),
      renewalReminderDays: String(s.renewalReminderDays),
      overageNoticeDays: String(s.overageNoticeDays),
      overageReadOnlyDays: String(s.overageReadOnlyDays),
    });
  }, []);
  useEffect(() => {
    plansApi.settings(request).then(apply).catch((e) => toast.error(apiErrorMessage(e)));
  }, [request, toast, apply]);
  if (!form || !saved) return <Card className="h-64 animate-pulse" aria-hidden />;

  const n = (k: keyof SettingsForm) => Number(form[k] || 0);
  const invalid = (Object.keys(SETTING_RANGE) as (keyof SettingsForm)[]).filter((k) => form[k] === "" || n(k) < SETTING_RANGE[k][0] || n(k) > SETTING_RANGE[k][1]);
  const dirty = (Object.keys(form) as (keyof SettingsForm)[]).some((k) => n(k) !== saved[k]);
  const input = (k: keyof SettingsForm, id: string) => (
    <input id={id} className={inputClassName} inputMode="numeric" aria-invalid={invalid.includes(k)} value={form[k]}
      onChange={(e) => setForm({ ...form, [k]: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><CalendarClock className="size-4" aria-hidden />Gia hạn</h3>
          <p className="mb-3 text-xs text-muted-foreground">Gói không tự trừ tiền. Chủ nhóm tự gia hạn; hệ thống nhắc trước và giữ quyền lợi thêm một thời gian ân hạn.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nhắc gia hạn trước (ngày)" htmlFor="st-remind" hint="1–30 ngày trước khi kỳ đã trả kết thúc.">{input("renewalReminderDays", "st-remind")}</Field>
            <Field label="Thời gian ân hạn (ngày)" htmlFor="st-grace" hint="0–30. Hết kỳ mà chưa gia hạn vẫn giữ hạn mức trả phí trong số ngày này.">{input("graceDays", "st-grace")}</Field>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Lock className="size-4" aria-hidden />Khi chủ nhóm vượt hạn mức</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Áp dụng khi hết ân hạn, hạ gói hoặc bị thu hồi hạn mức mà chủ nhóm vẫn có nhiều nhóm, thành viên hay dung lượng hơn gói cho phép. Không có dữ liệu nào bị xoá.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cảnh báo trước khi khoá (ngày)" htmlFor="st-notice" hint="0–60. Mọi thứ vẫn hoạt động, chủ nhóm được báo ngày khoá.">{input("overageNoticeDays", "st-notice")}</Field>
            <Field label="Chỉ đọc trước khi tạm ẩn (ngày)" htmlFor="st-ro" hint="1–365. Nhóm vượt hạn mức không thêm được nội dung mới.">{input("overageReadOnlyDays", "st-ro")}</Field>
          </div>
        </Card>
        <div className="flex flex-wrap items-center gap-3">
          <ConfirmButton
            variant="default"
            disabled={!dirty || invalid.length > 0}
            title="Lưu cài đặt Workspace?"
            description="Áp dụng ngay cho mọi tài khoản, kể cả tài khoản đang ân hạn hoặc đang vượt hạn mức: ngày khoá và ngày ẩn được tính lại theo số ngày mới."
            onConfirm={async () => {
              try {
                apply(await plansApi.updateSettings(request, {
                  graceDays: n("graceDays"),
                  renewalReminderDays: n("renewalReminderDays"),
                  overageNoticeDays: n("overageNoticeDays"),
                  overageReadOnlyDays: n("overageReadOnlyDays"),
                }));
                toast.success("Đã lưu cài đặt");
              } catch (e) {
                toast.error(apiErrorMessage(e));
              }
            }}
          >
            Lưu cài đặt
          </ConfirmButton>
          {dirty && <Button variant="ghost" onClick={() => apply(saved)}>Hoàn tác</Button>}
          {invalid.length > 0 && <span className="text-xs text-destructive" role="alert">Có giá trị ngoài khoảng cho phép.</span>}
          <span className="ml-auto text-xs text-muted-foreground">
            Cập nhật {formatVnDate(saved.updatedAt, true)}{saved.updatedBy ? ` bởi ${saved.updatedBy}` : ""} · Điều khoản {saved.termsVersion}
          </span>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold">Dòng thời gian khi không gia hạn</h3>
        <p className="mb-4 text-xs text-muted-foreground">Xem trước theo số ngày đang nhập. Chủ nhóm gia hạn, nâng cấp hoặc dọn dẹp ở bất kỳ bước nào thì nhóm trở lại bình thường ngay.</p>
        <ol className="relative space-y-4 border-l pl-5">
          {[
            { icon: BellRing, title: `${n("renewalReminderDays")} ngày trước khi hết kỳ`, body: "Gửi thông báo nhắc gia hạn." },
            { icon: ShieldCheck, title: "Hết kỳ đã trả", body: `Ân hạn ${n("graceDays")} ngày: giữ nguyên hạn mức và tính năng của gói.` },
            { icon: CalendarClock, title: `Ngày ${n("graceDays")}: về hạn mức Free`, body: `Nếu vượt hạn mức Free: cảnh báo ${n("overageNoticeDays")} ngày, mọi thứ vẫn hoạt động.` },
            { icon: Lock, title: `Ngày ${n("graceDays") + n("overageNoticeDays")}: chỉ đọc`, body: "Nhóm vượt hạn mức: xem, tải tài liệu, làm bài đã giao, xoá bớt được; không tải lên, không tạo bài, không nhắn tin mới." },
            { icon: EyeOff, title: `Ngày ${n("graceDays") + n("overageNoticeDays") + n("overageReadOnlyDays")}: tạm ẩn`, body: "Thành viên không mở được nhóm; chủ nhóm vẫn vào để dọn dẹp. Dữ liệu giữ nguyên, không tự xoá." },
            { icon: Eye, title: "Bất kỳ lúc nào", body: "Gia hạn, nâng cấp, xoá bớt thành viên/tài liệu hoặc chuyển nhóm cho người khác: mở lại ngay." },
          ].map((step) => (
            <li key={step.title}>
              <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full border bg-background"><step.icon className="size-3.5" aria-hidden /></span>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Nhóm bị ảnh hưởng: các nhóm ngoài số nhóm được phép (giữ lại nhóm hoạt động gần nhất), nhóm có quá số thành viên, và toàn bộ nhóm nếu vượt dung lượng.
        </p>
      </Card>
    </div>
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
                  <td className="px-3 py-2">{a.subject ?? <span className="text-muted-foreground">—</span>}</td>
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
