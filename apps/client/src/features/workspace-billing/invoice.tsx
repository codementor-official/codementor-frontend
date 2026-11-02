import { formatVnDate, formatVnd } from "@codementor/utils";
import type { RefundEffect, WorkspaceOrderDetail } from "@codementor/types";
import { CYCLE_LABEL, limitRows } from "./plan-presentation";

const PROVIDER: Record<string, string> = { vnpay: "VNPAY", momo: "MoMo", mock: "Thanh toán thử nghiệm" };
const KIND: Record<WorkspaceOrderDetail["kind"], string> = { new: "Mua gói", renewal: "Gia hạn gói", upgrade: "Nâng cấp lên gói" };

/** What a refund did to the subscription, in the buyer's words. */
export const REFUND_EFFECT: Record<RefundEffect, string> = {
  end_subscription:
    "Gói đã kết thúc ngay khi hoàn tiền và tài khoản trở về hạn mức Free. Nhóm, thành viên và tài liệu vẫn được giữ nguyên; nếu đang vượt hạn mức Free, các nhóm vượt sẽ được cảnh báo trước, rồi chuyển chỉ đọc, sau cùng tạm ẩn với thành viên cho đến khi bạn mua lại gói hoặc dọn dẹp.",
  drop_future_term: "Kỳ bạn đã trả trước được huỷ. Kỳ đang dùng vẫn giữ nguyên đến ngày hết hạn của nó.",
  money_only: "Kỳ của đơn này đã kết thúc trước khi hoàn tiền, nên gói hiện tại không thay đổi.",
};

/** Printable invoice of one Workspace order. Every figure comes from the price frozen at checkout. */
export function Invoice({ order }: { order: WorkspaceOrderDetail }) {
  const q = order.quote;
  const paid = order.status === "paid" || order.status === "refunded";
  return (
    <section aria-label="Hoá đơn" className="mt-6 border-t border-border-soft pt-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-navy">Hoá đơn gói Workspace</h3>
          <p className="text-xs text-text-muted">
            Số {order.id.slice(0, 8).toUpperCase()} · tạo {formatVnDate(order.createdAt, true)}
          </p>
        </div>
        <div className="text-right text-xs text-text-muted">
          <p className="font-semibold text-navy">{order.buyer.name}</p>
          <p>{order.buyer.email}</p>
        </div>
      </div>

      <table className="mt-4 w-full">
        <tbody>
          <tr className="border-b border-border-soft">
            <td className="py-2 pr-3">
              <p className="font-semibold text-navy">
                {KIND[order.kind]} {q.plan.name} (phiên bản {q.plan.version}) · theo {CYCLE_LABEL[q.billingCycle]}
              </p>
              <p className="text-xs text-text-muted">
                {order.term
                  ? `Kỳ sử dụng ${formatVnDate(order.term.startsAt)} – ${formatVnDate(order.term.endsAt)}`
                  : "Kỳ sử dụng bắt đầu khi cổng thanh toán xác nhận"}
                {" · "}điều khoản {q.termsVersion}
              </p>
            </td>
            <td className="py-2 text-right font-medium text-navy">{formatVnd(q.listPriceVnd)}</td>
          </tr>
          {q.discountVnd > 0 && q.coupon && (
            <tr>
              <td className="py-1.5 pr-3 text-text-muted">
                Mã khuyến mãi <span className="font-mono font-semibold text-navy">{q.coupon.code}</span> (
                {q.coupon.kind === "percent" ? `giảm ${q.coupon.value}%` : `giảm ${formatVnd(q.coupon.value)}`})
              </td>
              <td className="py-1.5 text-right text-success">−{formatVnd(q.discountVnd)}</td>
            </tr>
          )}
          {q.creditVnd > 0 && q.credit && (
            <tr>
              <td className="py-1.5 pr-3 text-text-muted">
                Trừ phần chưa dùng của gói cũ (kỳ {formatVnDate(q.credit.termStart)} – {formatVnDate(q.credit.termEnd)})
              </td>
              <td className="py-1.5 text-right text-success">−{formatVnd(q.creditVnd)}</td>
            </tr>
          )}
          <tr className="border-t border-border">
            <td className="pt-2 font-bold text-navy">{paid ? "Đã thanh toán" : "Tổng thanh toán"}</td>
            <td className="pt-2 text-right text-lg font-bold text-navy">{formatVnd(q.amountVnd)}</td>
          </tr>
          {q.discountVnd + q.creditVnd > 0 && (
            <tr>
              <td colSpan={2} className="pt-1 text-right text-xs text-success">
                Bạn tiết kiệm {formatVnd(q.discountVnd + q.creditVnd)} so với giá niêm yết
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-bg p-3 text-xs sm:grid-cols-4">
        <Field label="Phương thức" value={PROVIDER[order.payment.provider] ?? order.payment.provider} />
        <Field label="Mã giao dịch cổng" value={order.payment.reference ?? "—"} mono />
        <Field label="Thanh toán lúc" value={order.paidAt ? formatVnDate(order.paidAt, true) : "—"} />
        <Field label="Đơn vị tiền" value="VND, đã gồm mọi khoản" />
      </dl>

      {order.refund && (
        <div role="status" className="mt-4 rounded-md border border-border bg-surface p-3">
          <p className="font-semibold text-navy">Đã hoàn tiền {formatVnd(q.amountVnd)} lúc {formatVnDate(order.refund.at, true)}</p>
          {order.refund.effect && <p className="mt-1 text-text-muted">{REFUND_EFFECT[order.refund.effect]}</p>}
          {q.creditVnd > 0 && (
            <p className="mt-1 text-xs text-text-muted">Phần {formatVnd(q.creditVnd)} trừ từ gói cũ không phải tiền mặt nên không được hoàn.</p>
          )}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-text-muted">Hạn mức đã mua</summary>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {limitRows(q.entitlements).map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              <r.icon className="h-4 w-4 text-text-muted" aria-hidden />
              <span className="text-text-muted">{r.label}:</span>
              <span className="font-semibold text-navy">{r.value}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className={`mt-0.5 font-medium text-navy ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
