"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "@codementor/api-client";
import { Button, Field, SideDrawer, StatusBadge, useToast } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { AdminPlan, BillingCycle, CouponDetail } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { inputClassName } from "@/features/commerce/form-style";
import { plansApi } from "./api";
import { ORDER_LABEL, ORDER_TONE, couponStatus } from "./operations-tabs";
import { Section } from "./order-drawer";
import { TraceLink, useTrace } from "./trace";

const REDEMPTION: Record<string, string> = { reserved: "Đang giữ chỗ", redeemed: "Đã dùng", released: "Đã trả lại" };
const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** A coupon: what it is for, its terms (editable), and every order that used it. */
export function CouponDrawer({ couponId, onClose, onChanged }: { couponId: string; onClose: () => void; onChanged?: () => void }) {
  const request = useAdminApi();
  const toast = useToast();
  const trace = useTrace();
  const [data, setData] = useState<CouponDetail | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [editing, setEditing] = useState(false);
  const load = useCallback(() => plansApi.coupon(request, couponId).then(setData).catch((e) => toast.error(apiErrorMessage(e))), [request, couponId, toast]);
  useEffect(() => {
    void load();
    plansApi.plans(request).then(setPlans).catch(() => setPlans([]));
  }, [load, request]);

  const c = data?.coupon;
  const planName = (id: string) => plans.find((p) => p.id === id)?.onSale?.name ?? "gói đã xoá";
  const used = data?.redemptions.filter((r) => r.status !== "released").length ?? 0;
  const given = data?.redemptions.filter((r) => r.status === "redeemed").reduce((s, r) => s + r.order.discountVnd, 0) ?? 0;
  const status = c ? couponStatus(c) : null;

  return (
    <SideDrawer open onClose={onClose} width="wide" title={c ? `Mã ${c.code}` : "Mã giảm giá"} description={c?.description || undefined}>
      {!c || !status ? (
        <div className="h-40 animate-pulse rounded-md bg-muted" aria-hidden />
      ) : editing ? (
        <CouponForm
          coupon={c}
          used={used}
          plans={plans}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await load();
            onChanged?.();
          }}
        />
      ) : (
        <div className="space-y-6 text-sm">
          <section className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <span className="text-2xl font-semibold">{c.kind === "percent" ? `−${c.value}%` : `−${formatVnd(c.value)}`}</span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setEditing(true)}>Sửa mã</Button>
          </section>

          <Section title="Điều kiện áp dụng">
            <dl className="grid grid-cols-[160px_1fr] gap-y-1">
              <dt className="text-muted-foreground">Mục đích</dt><dd>{c.description || "—"}</dd>
              <dt className="text-muted-foreground">Hiệu lực</dt><dd>{formatVnDate(c.starts_at, true)} – {formatVnDate(c.ends_at, true)}</dd>
              <dt className="text-muted-foreground">Gói</dt><dd>{c.plan_ids?.length ? c.plan_ids.map(planName).join(", ") : "Mọi gói trả phí"}</dd>
              <dt className="text-muted-foreground">Chu kỳ</dt><dd>{c.billing_cycles?.length ? c.billing_cycles.map((x) => (x === "month" ? "Theo tháng" : "Theo năm")).join(", ") : "Tháng và năm"}</dd>
              <dt className="text-muted-foreground">Khách hàng</dt><dd>{c.new_customers_only ? "Chỉ người mua lần đầu" : "Mọi người"}</dd>
              <dt className="text-muted-foreground">Giới hạn</dt><dd>{c.max_redemptions ? `${c.max_redemptions} lượt tổng` : "Không giới hạn tổng"} · {c.per_user_limit} lượt mỗi người</dd>
              <dt className="text-muted-foreground">Áp dụng cho</dt><dd>Đơn mua mới và nâng cấp; không áp dụng khi gia hạn. Số phải trả sau giảm tối thiểu 5.000 ₫.</dd>
              <dt className="text-muted-foreground">Tạo bởi</dt><dd>{c.created_by_name ?? "—"} · {formatVnDate(c.created_at, true)} · lịch sử sửa trong Nhật ký</dd>
            </dl>
          </Section>

          <Section title={`Lượt dùng (${used}${c.max_redemptions ? ` / ${c.max_redemptions}` : ""})`} hint={`Tổng tiền đã giảm trên các đơn đã thanh toán: ${formatVnd(given)}.`}>
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-1 font-medium">Thời gian</th><th className="font-medium">Người dùng</th><th className="font-medium">Đơn</th><th className="text-right font-medium">Giảm</th><th className="pl-3 font-medium">Trạng thái</th></tr>
              </thead>
              <tbody>
                {data!.redemptions.map((r) => (
                  <tr key={r.order.id} className="border-t">
                    <td className="py-1">{formatVnDate(r.at, true)}</td>
                    <td><TraceLink onClick={() => trace.openUser(r.user.id)}>{r.user.name}</TraceLink></td>
                    <td>
                      <TraceLink onClick={() => trace.openOrder(r.order.id)}>{r.order.plan} · {formatVnd(r.order.amountVnd)}</TraceLink>{" "}
                      <StatusBadge tone={ORDER_TONE[r.order.status]}>{ORDER_LABEL[r.order.status]}</StatusBadge>
                    </td>
                    <td className="text-right">−{formatVnd(r.order.discountVnd)}</td>
                    <td className="pl-3">{REDEMPTION[r.status]}</td>
                  </tr>
                ))}
                {data!.redemptions.length === 0 && <tr><td colSpan={5} className="py-3 text-muted-foreground">Chưa có ai dùng mã này.</td></tr>}
              </tbody>
            </table>
          </Section>
        </div>
      )}
    </SideDrawer>
  );
}

function CouponForm({
  coupon: c,
  used,
  plans,
  onCancel,
  onSaved,
}: {
  coupon: CouponDetail["coupon"];
  used: number;
  plans: AdminPlan[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const request = useAdminApi();
  const toast = useToast();
  const [f, setF] = useState({
    description: c.description,
    kind: c.kind,
    value: String(c.value),
    startsAt: toLocal(c.starts_at),
    endsAt: toLocal(c.ends_at),
    max: c.max_redemptions ? String(c.max_redemptions) : "",
    perUser: String(c.per_user_limit),
    planIds: c.plan_ids ?? [],
    cycles: (c.billing_cycles ?? []) as BillingCycle[],
    newOnly: c.new_customers_only,
  });
  const [error, setError] = useState("");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const locked = used > 0;

  async function save() {
    const value = Number(f.value);
    if (!(value > 0) || (f.kind === "percent" && value > 100)) return setError("Mức giảm không hợp lệ.");
    if (!f.startsAt || !f.endsAt || f.endsAt <= f.startsAt) return setError("Thời điểm kết thúc phải sau thời điểm bắt đầu.");
    if (f.max && Number(f.max) < used) return setError(`Tổng lượt dùng không được nhỏ hơn ${used} lượt đã dùng hoặc đang giữ.`);
    try {
      await plansApi.updateCoupon(request, c.id, {
        description: f.description,
        ...(locked ? {} : { kind: f.kind, value }),
        startsAt: new Date(f.startsAt).toISOString(),
        endsAt: new Date(f.endsAt).toISOString(),
        maxRedemptions: f.max ? Number(f.max) : null,
        perUserLimit: Number(f.perUser) || 1,
        planIds: f.planIds,
        billingCycles: f.cycles,
        newCustomersOnly: f.newOnly,
      });
      toast.success(`Đã lưu mã ${c.code}`);
      await onSaved();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Mã <strong>{c.code}</strong> không đổi được. Thay đổi chỉ áp dụng cho lượt mua sau; đơn đã tạo giữ nguyên giá.
        {locked && " Mã đã có người dùng nên mức giảm bị khoá — muốn đổi mức giảm, hãy tắt mã này và tạo mã mới."}
      </p>
      <Field label="Mục đích (hiển thị cho quản trị viên)" htmlFor="ce-desc">
        <input id="ce-desc" className={inputClassName} maxLength={200} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="vd. Ưu đãi ra mắt cho 500 khách đầu tiên" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kiểu giảm" htmlFor="ce-kind">
          <select id="ce-kind" className={inputClassName} disabled={locked} value={f.kind} onChange={(e) => set("kind", e.target.value as "percent" | "fixed")}>
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền cố định (₫)</option>
          </select>
        </Field>
        <Field label={f.kind === "percent" ? "Giảm (%)" : "Giảm (₫)"} htmlFor="ce-value">
          <input id="ce-value" className={inputClassName} disabled={locked} inputMode="numeric" value={f.value} onChange={(e) => set("value", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Bắt đầu" htmlFor="ce-start"><input id="ce-start" type="datetime-local" className={inputClassName} value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
        <Field label="Kết thúc" htmlFor="ce-end"><input id="ce-end" type="datetime-local" className={inputClassName} value={f.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
        <Field label={`Tổng lượt dùng (trống = không giới hạn, tối thiểu ${used})`} htmlFor="ce-max">
          <input id="ce-max" className={inputClassName} inputMode="numeric" value={f.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Lượt mỗi người" htmlFor="ce-per"><input id="ce-per" className={inputClassName} inputMode="numeric" value={f.perUser} onChange={(e) => set("perUser", e.target.value.replace(/\D/g, ""))} /></Field>
      </div>
      <fieldset>
        <legend className="mb-1 font-medium">Phạm vi (bỏ trống = mọi gói, mọi chu kỳ)</legend>
        <div className="flex flex-wrap gap-3">
          {plans.filter((p) => !p.isDefault).map((p) => (
            <label key={p.id} className="flex items-center gap-1.5"><input type="checkbox" checked={f.planIds.includes(p.id)} onChange={() => set("planIds", toggle(f.planIds, p.id))} /> {p.onSale?.name ?? p.code}</label>
          ))}
          {(["month", "year"] as const).map((x) => (
            <label key={x} className="flex items-center gap-1.5"><input type="checkbox" checked={f.cycles.includes(x)} onChange={() => set("cycles", toggle(f.cycles, x))} /> {x === "month" ? "Theo tháng" : "Theo năm"}</label>
          ))}
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={f.newOnly} onChange={(e) => set("newOnly", e.target.checked)} /> Chỉ người mua lần đầu</label>
        </div>
      </fieldset>
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button onClick={save}>Lưu thay đổi</Button>
      </div>
    </div>
  );
}
