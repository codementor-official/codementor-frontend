"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Card, ConfirmButton, Field, Modal, ReasonButton, ServerPagination, StatusBadge, useToast, useUrlState } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, BillingCycle, BillingPage, WorkspaceCoupon, WorkspaceOrder } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi, type AuditEntry, type CouponInput } from "./api";
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Mã chỉ áp dụng cho gói mới và nâng cấp. Mã đã dùng không sửa được; hãy ngừng mã và tạo mã mới.</p>
        <Button onClick={() => setCreating(true)}>Tạo mã giảm giá</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Mã</th>
              <th className="px-3 py-2 font-medium">Giảm</th>
              <th className="px-3 py-2 font-medium">Hiệu lực</th>
              <th className="px-3 py-2 font-medium">Đã dùng</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {coupons?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2 font-mono font-medium">{c.code}</td>
                <td className="px-3 py-2">{c.kind === "percent" ? `${c.value}%` : formatVnd(c.value)}{c.new_customers_only && <span className="block text-xs text-muted-foreground">Khách mới</span>}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{formatVnDate(c.starts_at)} – {formatVnDate(c.ends_at)}</td>
                <td className="px-3 py-2">{c.redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}{c.reserved > 0 && <span className="text-xs text-muted-foreground"> (+{c.reserved} đang giữ)</span>}</td>
                <td className="px-3 py-2"><StatusBadge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Hoạt động" : "Đã ngừng"}</StatusBadge></td>
                <td className="px-3 py-2 text-right">
                  {c.is_active && (
                    <ConfirmButton size="sm" title={`Ngừng mã ${c.code}?`} description="Mã không dùng được cho đơn mới. Đơn đã áp mã giữ nguyên giá."
                      onConfirm={async () => {
                        try {
                          await plansApi.deactivateCoupon(request, c.id);
                          toast.success("Đã ngừng mã");
                          await load();
                        } catch (e) {
                          toast.error(apiErrorMessage(e));
                        }
                      }}>
                      Ngừng
                    </ConfirmButton>
                  )}
                </td>
              </tr>
            ))}
            {coupons?.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Chưa có mã giảm giá.</td></tr>}
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
        <Field label="Mã" htmlFor="c-code"><input id="c-code" className={inputClassName} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
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
        <Field label="Lượt mỗi người" htmlFor="c-per"><input id="c-per" className={inputClassName} inputMode="numeric" value={f.perUser} onChange={(e) => set("perUser", e.target.value.replace(/\D/g, ""))} /></Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.newOnly} onChange={(e) => set("newOnly", e.target.checked)} /> Chỉ khách mua lần đầu</label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Áp dụng cho gói (bỏ trống = mọi gói)</legend>
          <div className="flex flex-wrap gap-3">
            {plans.filter((p) => !p.isDefault).map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.planIds.includes(p.id)} onChange={() => set("planIds", toggle(f.planIds, p.id))} /> {p.onSale?.name ?? p.code}</label>
            ))}
            {(["month", "year"] as const).map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.cycles.includes(c)} onChange={() => set("cycles", toggle(f.cycles, c))} /> {c === "month" ? "Theo tháng" : "Theo năm"}</label>
            ))}
          </div>
        </fieldset>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}

export function SettingsTab() {
  const request = useAdminApi();
  const toast = useToast();
  const [form, setForm] = useState<{ graceDays: string; renewalReminderDays: string; termsVersion: string } | null>(null);
  useEffect(() => {
    plansApi.settings(request).then((s) => setForm({ graceDays: String(s.graceDays), renewalReminderDays: String(s.renewalReminderDays), termsVersion: s.termsVersion })).catch((e) => toast.error(apiErrorMessage(e)));
  }, [request, toast]);
  if (!form) return <Card className="h-40 animate-pulse" aria-hidden />;
  return (
    <Card className="max-w-xl p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Thời gian ân hạn (ngày, 0–30)" htmlFor="st-grace" hint="Sau khi kỳ kết thúc mà chưa gia hạn, hạn mức trả phí được giữ thêm số ngày này.">
          <input id="st-grace" className={inputClassName} inputMode="numeric" value={form.graceDays} onChange={(e) => setForm({ ...form, graceDays: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field label="Nhắc gia hạn trước (ngày, 1–30)" htmlFor="st-remind">
          <input id="st-remind" className={inputClassName} inputMode="numeric" value={form.renewalReminderDays} onChange={(e) => setForm({ ...form, renewalReminderDays: e.target.value.replace(/\D/g, "") })} />
        </Field>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Điều khoản hiện hành: {form.termsVersion}. Không có gói nào tự động trừ tiền.</p>
      <ConfirmButton className="mt-4" variant="default" title="Lưu cài đặt thanh toán?" description="Thay đổi áp dụng ngay cho mọi gói, kể cả gói đang trong thời gian ân hạn."
        onConfirm={async () => {
          try {
            await plansApi.updateSettings(request, { graceDays: Number(form.graceDays), renewalReminderDays: Number(form.renewalReminderDays) });
            toast.success("Đã lưu cài đặt");
          } catch (e) {
            toast.error(apiErrorMessage(e));
          }
        }}>
        Lưu cài đặt
      </ConfirmButton>
    </Card>
  );
}

export function AuditTab() {
  const request = useAdminApi();
  const [page, setPage] = useUrlState("aPage", 1);
  const [data, setData] = useState<{ items: AuditEntry[]; page: number; limit: number } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    plansApi.audit(request, page).then(setData).catch((e) => setError(apiErrorMessage(e)));
  }, [request, page]);
  if (error) return <Card className="p-4 text-sm text-destructive" role="alert">{error}</Card>;
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y text-sm">
        {data?.items.map((a) => (
          <li key={a.id} className="px-4 py-2">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <span className="w-36 text-xs text-muted-foreground">{formatVnDate(a.created_at, true)}</span>
                <span className="font-medium">{actionLabel(a.action)}</span>
                <span className="text-xs text-muted-foreground">{a.actor ?? "Hệ thống"}</span>
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(a.details, null, 2)}</pre>
            </details>
          </li>
        ))}
        {data?.items.length === 0 && <li className="px-4 py-6 text-center text-muted-foreground">Chưa có nhật ký.</li>}
      </ul>
      <div className="flex justify-between border-t px-4 py-2">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
        <Button size="sm" variant="ghost" disabled={!data || data.items.length < data.limit} onClick={() => setPage(page + 1)}>Trang sau</Button>
      </div>
    </Card>
  );
}
