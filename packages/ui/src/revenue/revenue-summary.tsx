import type { RevenueReport } from "@codementor/types";
import { revenueMoney } from "./format";

export function RevenueSummary({ report }: { report: RevenueReport }) {
  const shareLabel =
    report.scope === "admin" ? "Phần thu hệ thống" : "Doanh thu của bạn";
  return (
    <div className="rounded-lg border bg-card">
      <dl className="grid gap-5 p-5 sm:grid-cols-3 sm:gap-6">
        <div>
          <dt className="text-sm text-muted-foreground">
            {shareLabel} trước phí
          </dt>
          <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {revenueMoney(report.totals.revenue)}
          </dd>
          <p className="mt-2 text-sm text-muted-foreground">
            Đã loại trừ đơn hoàn tiền
          </p>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">
            Giá trị đơn đã thanh toán
          </dt>
          <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {revenueMoney(report.totals.gross)}
          </dd>
          <p className="mt-2 text-sm text-muted-foreground">
            Gồm {revenueMoney(report.totals.refunded)} thuộc đơn đã hoàn
          </p>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">
            Đơn đã thanh toán / hoàn tiền
          </dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">
            {report.totals.paidOrders.toLocaleString("vi-VN")}
          </dd>
          <p className="mt-2 text-sm text-muted-foreground">
            Bình quân{" "}
            {revenueMoney(
              report.totals.paidOrders
                ? report.totals.gross / report.totals.paidOrders
                : 0,
            )}{" "}
            / đơn
          </p>
        </div>
      </dl>
      <details className="border-t px-5 py-3 text-sm text-muted-foreground">
        <summary className="w-fit cursor-pointer font-medium">
          Cách tính và phạm vi số liệu
        </summary>
        <p className="pt-3 leading-6">
          Thanh toán tính theo ngày xác nhận và tỷ lệ phân bổ đã lưu của từng
          đơn. Phần thu chưa trừ phí cổng thanh toán, không phải số dư có thể
          rút. Hoàn tiền ở đây thuộc các đơn trong kỳ, không phải tổng tiền hoàn
          trả phát sinh trong kỳ.
        </p>
      </details>
    </div>
  );
}
