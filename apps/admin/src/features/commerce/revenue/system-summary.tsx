import type { RevenueInstructor, RevenueReport } from "@codementor/types";
import { vnd } from "../api";

export function SystemRevenueSummary({
  report,
  instructors,
}: {
  report: RevenueReport;
  instructors: RevenueInstructor[];
}) {
  const lecturerShare = instructors.reduce((sum, i) => sum + i.revenue, 0);
  const active = instructors.filter((i) => i.orders > 0).length;
  const items = [
    {
      label: "Tiền học viên thanh toán",
      value: report.totals.gross,
      hint: "Giá trị toàn đơn, trước hoàn tiền; không phải doanh thu riêng của CodeMentor.",
    },
    {
      label: "Phần phân bổ cho giảng viên",
      value: lecturerShare,
      hint: "Thu nhập của giảng viên từ đơn đã thanh toán, chưa trừ phí.",
    },
    {
      label: "Phần phân bổ cho CodeMentor",
      value: report.totals.revenue,
      hint: "Phần hệ thống được hưởng từ đơn đã thanh toán, chưa trừ phí.",
    },
  ];
  return (
    <section
      aria-label="Tiền thanh toán và phân bổ"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 p-5">
            <dt className="text-sm font-medium text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">
              {vnd(item.value)}
            </dd>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.hint}
            </p>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t bg-muted/20 px-5 py-3 text-sm">
        <span>
          <strong className="tabular-nums">
            {report.totals.paidOrders.toLocaleString("vi-VN")}
          </strong>{" "}
          đơn đã thanh toán / hoàn tiền
        </span>
        <span>
          <strong className="tabular-nums">
            {active} / {instructors.length}
          </strong>{" "}
          giảng viên có đơn
        </span>
        <span>
          Đã hoàn:{" "}
          <strong className="tabular-nums">
            {vnd(report.totals.refunded)}
          </strong>
        </span>
      </div>
      <details className="border-t px-5 py-3 text-sm">
        <summary className="w-fit cursor-pointer font-medium">
          Vì sao các khoản tiền khác nhau?
        </summary>
        <p className="mt-3 leading-6 text-muted-foreground">
          Học viên trả tiền cho toàn bộ đơn; từng đơn có tỷ lệ phân bổ riêng cho
          giảng viên và CodeMentor. Hai phần phân bổ loại trừ đơn đã hoàn tiền
          và không được tính lại theo chính sách hiện tại. Các khoản này chưa
          trừ phí cổng thanh toán, không phải số dư ngân hàng hoặc tiền giảng
          viên có thể rút ngay. Số tiền hoàn ở đây thuộc các đơn được xác nhận
          trong kỳ, không phải tổng hoàn trả phát sinh trong kỳ.
        </p>
      </details>
    </section>
  );
}
