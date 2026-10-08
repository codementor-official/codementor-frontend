"use client";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button, ServerPagination } from "@codementor/ui";
import {
  COMMERCE_STATUS,
  type CommerceJobOrder,
  type CommerceJobOrderReport,
} from "@codementor/types";
import { vnd } from "./api";

const labels: Record<CommerceJobOrder["reason"], string> = {
  released: "Đã mở doanh thu trong lượt này",
  available: "Doanh thu đã được mở trước đó",
  refund: "Chờ xử lý hoàn tiền",
  verification: "Chờ xác minh thanh toán",
  holding: "Chưa hết thời gian giữ",
  eligible: "Đủ điều kiện, đang chờ xử lý",
  review: "Giao dịch cần kiểm tra",
  not_paid: "Chưa có thanh toán được ghi nhận",
};
export const jobTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : "Chưa có mốc thời gian";

export function jobOrderExplanation(order: CommerceJobOrder): string {
  switch (order.reason) {
    case "released":
      return order.debtOffsetVnd > 0
        ? `Đã cộng ${vnd(order.releasedAmountVnd)} vào số dư khả dụng; ${vnd(order.debtOffsetVnd)} dùng bù khoản cần thu hồi.`
        : `Đã cộng ${vnd(order.releasedAmountVnd)} vào số dư khả dụng của ${order.instructorName}. Giảng viên có thể tạo yêu cầu rút khi đạt mức tối thiểu.`;
    case "available":
      return "Khoản này đã được mở, không cộng thêm lần nữa trong lượt này. Số dư còn lại phụ thuộc các giao dịch rút và hoàn tiền.";
    case "refund":
      return "Có yêu cầu hoàn tiền đang xử lý hoặc đã xác nhận. Kiểm tra chi tiết hoàn tiền; chưa mở khoản này cho giảng viên rút.";
    case "verification":
      return order.verificationDeferred && order.nextVerificationAt
        ? `Chưa đến lượt tra soát tiếp theo. Sớm nhất ${jobTime(order.nextVerificationAt)} hệ thống mới có thể hỏi lại cổng thanh toán. Bấm đối soát trước mốc này không mở tiền.`
        : "Chưa có kết quả xác minh cuối từ cổng thanh toán. Lượt đối soát tiếp theo kiểm tra giao dịch; chỉ mở tiền khi được xác nhận và đủ điều kiện.";
    case "holding":
      return order.holdUntil
        ? `Chờ đến ${jobTime(order.holdUntil)}. Sau mốc này, lượt tự động hoặc Admin đối soát mới mở tiền nếu đủ điều kiện. Không cần chạy lại trước hạn.`
        : "Đơn chưa có hạn giữ hợp lệ. Kiểm tra chi tiết đơn; không coi khoản này là đủ điều kiện rút.";
    case "eligible":
      return "Thanh toán đã xác minh và hết hạn giữ. Đợi lượt tự động tiếp theo; nếu có lỗi tác vụ, kiểm tra trước khi chạy lại.";
    case "review":
      return "Kết quả thanh toán cần được kiểm tra. Xem chi tiết đơn và nhật ký; không ép giao dịch thành công.";
    case "not_paid":
      return `Trạng thái đơn: ${COMMERCE_STATUS[order.status] ?? order.status}. Chưa mở doanh thu từ đơn này.`;
  }
}

export function JobOrdersTable({
  report,
  openOrder,
  disabled = false,
  onPageChange,
}: {
  report: CommerceJobOrderReport;
  openOrder: (id: string) => void;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const [localPage, setLocalPage] = useState(1);
  const page = onPageChange ? report.page : localPage;
  const items = onPageChange
    ? report.items
    : report.items.slice((page - 1) * 10, page * 10);
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/30 p-3">
        <h3 className="font-semibold">Từng đơn đang ở bước nào?</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Trạng thái lúc {jobTime(report.capturedAt)} · Giờ Việt Nam. Tiền dưới
          đây là phần của giảng viên, không phải toàn bộ tiền học viên trả.
        </p>
      </div>
      {report.items.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Không có đơn đang giữ doanh thu hoặc được kiểm tra trong danh sách
          này. Không có nghĩa số dư giảng viên bằng 0.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="block w-full text-left text-sm md:table">
            <thead className="hidden bg-muted text-xs text-muted-foreground md:table-header-group">
              <tr>
                {["Đơn / giảng viên", "Kết quả & lý do", "Chi tiết"].map(
                  (label) => (
                    <th key={label} className="p-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="block divide-y md:table-row-group">
              {items.map((order) => (
                <tr key={order.id} className="block p-3 md:table-row md:p-0">
                  <td className="block align-top md:table-cell md:w-1/3 md:p-3">
                    <p className="font-semibold">{order.courseTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{order.id.slice(0, 8)} · {order.buyerName}
                    </p>
                    <p className="mt-2 text-xs">{order.instructorName}</p>
                    <p className="mt-1 font-medium tabular-nums">
                      {vnd(order.instructorAmountVnd)}
                    </p>
                    {order.reason !== "released" &&
                      order.reason !== "available" && (
                        <p className="text-xs text-muted-foreground">
                          Chưa chuyển sang khả dụng
                        </p>
                      )}
                  </td>
                  <td className="mt-3 block align-top md:mt-0 md:table-cell md:p-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${order.reason === "released" || order.reason === "available" ? "bg-foreground text-background" : "bg-muted text-foreground"}`}
                    >
                      {labels[order.reason]}
                    </span>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {jobOrderExplanation(order)}
                    </p>
                    {order.holdUntil && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hạn giữ: {jobTime(order.holdUntil)}
                        {order.verifiedAt
                          ? ` · Đã xác minh: ${jobTime(order.verifiedAt)}`
                          : " · Chưa xác minh xong"}
                      </p>
                    )}
                    {order.encounteredError && (
                      <p className="mt-2 text-xs text-destructive">
                        Lượt vừa chạy gặp lỗi khi xử lý đơn này. Kiểm tra nhật
                        ký trước khi thử lại.
                      </p>
                    )}
                  </td>
                  <td className="mt-3 block align-top md:mt-0 md:table-cell md:p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      disabled={disabled}
                      onClick={() => openOrder(order.id)}
                    >
                      <Eye className="size-4" /> Xem đơn
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ServerPagination
        page={page}
        total={onPageChange ? report.total : report.items.length}
        pageSize={onPageChange ? report.limit : 10}
        disabled={disabled}
        onPageChange={onPageChange ?? setLocalPage}
      />
      {!onPageChange && report.total > report.items.length && (
        <p className="border-t p-3 text-xs text-muted-foreground">
          Báo cáo chứa {report.items.length}/{report.total} đơn, ưu tiên đơn
          được xử lý trong lượt này. Mở “Xem đơn đang chờ” để duyệt toàn bộ danh
          sách hiện tại.
        </p>
      )}
    </section>
  );
}
