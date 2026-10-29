"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Lock, TicketPercent } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { useToast } from "@codementor/ui";
import { formatVnDate, formatVnd } from "@codementor/utils";
import type { BillingCycle, Quote } from "@codementor/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { billingApi, billingErrorCode, type PaymentProvider } from "./api";
import { CYCLE_LABEL, EntitlementDiff, limitRows } from "./plan-presentation";

const PROVIDER_LABEL: Record<PaymentProvider, string> = { mock: "Thanh toán thử (môi trường kiểm thử)", vnpay: "VNPAY", momo: "Ví MoMo" };
const CHANGE_LABEL = { new: "Đăng ký mới", renewal: "Gia hạn", upgrade: "Nâng cấp" } as const;

export function CheckoutScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const planId = params.get("plan") ?? "";
  const cycle: BillingCycle = params.get("cycle") === "year" ? "year" : "month";
  const [quote, setQuote] = useState<Quote | null>(null);
  const [methods, setMethods] = useState<PaymentProvider[]>([]);
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [couponError, setCouponError] = useState("");
  const [paying, setPaying] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);

  const requote = useCallback(
    (code?: string) =>
      billingApi
        .quote(planId, cycle, code)
        .then((q) => {
          setQuote(q);
          setAppliedCoupon(code);
          setCouponError("");
        })
        .catch((e) => {
          if (code && billingErrorCode(e) === "WORKSPACE_COUPON_INVALID") setCouponError(apiErrorMessage(e));
          else setError(apiErrorMessage(e));
        }),
    [planId, cycle],
  );

  useEffect(() => {
    if (!planId) return;
    void requote();
    billingApi
      .paymentMethods()
      .then((c) => {
        setMethods(c.methods);
        setProvider(c.methods[0] ?? null);
      })
      .catch(() => setMethods([]));
  }, [planId, requote]);

  async function pay() {
    if (!quote?.snapshot || !provider) return;
    setPaying(true);
    setConflict(null);
    try {
      const order = await billingApi.checkout({
        planId,
        billingCycle: cycle,
        couponCode: appliedCoupon,
        provider,
        expectedAmountVnd: quote.snapshot.amountVnd,
      });
      if (order.payment.checkoutUrl) window.location.assign(order.payment.checkoutUrl);
      else router.push(`/workspace/billing/checkout/result?order=${order.id}`);
    } catch (e) {
      const code = billingErrorCode(e);
      if (code === "WORKSPACE_QUOTE_CHANGED") {
        toast.info("Giá vừa thay đổi. Vui lòng xem lại tổng tiền.");
        await requote(appliedCoupon);
      } else if (code === "WORKSPACE_PLAN_CHANGE_CONFLICT") setConflict(apiErrorMessage(e));
      else toast.error(apiErrorMessage(e));
      setPaying(false);
    }
  }

  const shownError = planId ? error : "Chưa chọn gói. Hãy chọn gói từ bảng giá.";
  const s = quote?.snapshot;
  const scheduledOnly = quote && !s;

  return (
    <>
      <PageHeader icon={CreditCard} title="Xác nhận thanh toán" subtitle="Kiểm tra quyền lợi và số tiền trước khi chuyển sang cổng thanh toán." />

      {shownError && (
        <Card className="p-5 text-sm text-danger" role="alert">
          {shownError} <Link href="/workspace/pricing" className="font-semibold underline">Về bảng giá</Link>
        </Card>
      )}

      {scheduledOnly && (
        <Card className="p-5 text-sm text-text">
          Thay đổi này được áp dụng vào cuối kỳ hiện tại, không thanh toán ngay.{" "}
          <Link href="/workspace/pricing" className="font-semibold text-primary">Lên lịch từ bảng giá</Link>
        </Card>
      )}

      {s && quote && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <p className="text-xs font-semibold uppercase text-text-muted">{CHANGE_LABEL[s.kind]}</p>
            <h2 className="mt-1 text-xl font-bold text-navy">
              {s.plan.name} · theo {CYCLE_LABEL[s.billingCycle]}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Hiệu lực từ {formatVnDate(quote.effectiveAt)}
              {quote.endsAt ? ` đến ${formatVnDate(quote.endsAt)}` : ""}.
              {s.kind === "renewal" && " Giá và hạn mức giữ nguyên như khi bạn mua."}
            </p>
            <div className="mt-5">
              {quote.current && s.kind !== "renewal" ? (
                <EntitlementDiff from={quote.current.entitlements} to={s.entitlements} fromLabel={quote.current.planName} toLabel={s.plan.name} />
              ) : (
                <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {limitRows(s.entitlements).map((r) => (
                    <li key={r.key} className="flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-text-muted" aria-hidden />
                      <span className="text-text-muted">{r.label}:</span>
                      <span className="font-semibold text-navy">{r.value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-4 text-xs text-text-muted">
              Áp dụng điều khoản {s.termsVersion}. Gói không tự động trừ tiền; bạn chủ động gia hạn ở mỗi kỳ.
            </p>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="font-semibold text-navy">Thanh toán</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Line label={`Giá gói (${CYCLE_LABEL[s.billingCycle]})`} value={formatVnd(s.listPriceVnd)} />
              {s.discountVnd > 0 && <Line label={`Mã ${s.coupon?.code}`} value={`− ${formatVnd(s.discountVnd)}`} />}
              {s.creditVnd > 0 && <Line label="Trừ phần chưa dùng của gói cũ" value={`− ${formatVnd(s.creditVnd)}`} />}
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-semibold text-navy">Tổng thanh toán</dt>
                <dd className="text-2xl font-bold text-navy">{formatVnd(s.amountVnd)}</dd>
              </div>
            </dl>

            {s.kind !== "renewal" && (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void requote(coupon.trim() || undefined);
                }}
              >
                <label htmlFor="coupon" className="text-xs font-semibold text-text-muted">
                  Mã giảm giá
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="coupon"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    maxLength={32}
                    aria-invalid={!!couponError}
                    aria-describedby={couponError ? "coupon-error" : undefined}
                    className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy"
                    placeholder="Nhập mã"
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={!coupon.trim()}>
                    <TicketPercent className="h-4 w-4" /> Áp dụng
                  </Button>
                </div>
                {couponError && (
                  <p id="coupon-error" className="mt-1 text-xs text-danger">
                    {couponError}
                  </p>
                )}
              </form>
            )}

            <fieldset className="mt-5">
              <legend className="text-xs font-semibold text-text-muted">Phương thức</legend>
              {methods.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">Thanh toán trực tuyến chưa được cấu hình.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {methods.map((m) => (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors duration-150 ${
                        provider === m ? "border-navy bg-border-soft" : "border-border hover:bg-bg"
                      }`}
                    >
                      <input type="radio" name="provider" value={m} checked={provider === m} onChange={() => setProvider(m)} />
                      <span className="font-medium text-navy">{PROVIDER_LABEL[m]}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {conflict && (
              <p className="mt-4 rounded-md bg-primary-tint p-3 text-sm text-text" role="alert">
                {conflict} <Link href="/workspace/billing" className="font-semibold text-primary">Xem giao dịch đang mở</Link>
              </p>
            )}

            <Button className="mt-5 w-full" onClick={pay} disabled={paying || !provider}>
              <Lock className="h-4 w-4" /> {paying ? "Đang chuyển sang cổng thanh toán…" : `Thanh toán ${formatVnd(s.amountVnd)}`}
            </Button>
            <p className="mt-2 text-center text-xs text-text-muted">
              Gói chỉ được kích hoạt sau khi cổng thanh toán xác nhận giao dịch.
            </p>
          </Card>
        </div>
      )}

      {!quote && !shownError && (
        <Card className="h-64 animate-pulse p-5" aria-hidden>
          <span className="sr-only">Đang tải báo giá</span>
        </Card>
      )}
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
