"use client";
import { useEffect, useState } from "react";
import type { CommerceOrder, WalletSummary } from "@codementor/types";
import { formatHoldingPeriod } from "@codementor/utils";
import { ChevronDown, Clock3 } from "lucide-react";
import { Card } from "@codementor/ui";
import { vnd } from "./api";

export function holdingDeadline(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function remaining(deadline: string, now: number) {
  const minutes = Math.ceil((Date.parse(deadline) - now) / 60000);
  if (!Number.isFinite(minutes)) return "Chưa xác định";
  if (minutes <= 0) return "Đã hết thời gian giữ; chờ kiểm tra và chuyển số dư";
  if (minutes >= 1440) return `Còn khoảng ${Math.ceil(minutes / 1440)} ngày`;
  return `Còn khoảng ${minutes} phút`;
}

export function HoldingExplanation({ wallet }: { wallet: WalletSummary }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Card>
      <details className="group p-4">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
          <Clock3 className="size-4 shrink-0 text-primary" />
          <span>Tiền đang giữ & thời điểm có thể rút</span>
          <span className="ml-auto text-sm tabular-nums">
            {vnd(wallet.balances.pending ?? 0)}
          </span>
          <ChevronDown className="size-4 shrink-0 group-open:rotate-180" />
        </summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p>
              Đang giữ/chờ xử lý:{" "}
              <strong className="tabular-nums">
                {vnd(wallet.balances.pending ?? 0)}
              </strong>
              . Đây là phần doanh thu của bạn đã ghi nhận nhưng chưa chuyển sang
              số dư khả dụng.
            </p>
            <p className="text-muted-foreground">
              Đơn mới giữ{" "}
              {formatHoldingPeriod(
                wallet.policy.holdMinutes ?? wallet.policy.holdDays * 1440,
              )}{" "}
              từ khi xác nhận thanh toán. Từng đơn cũ giữ đúng thời gian đã lưu,
              không áp dụng lại chính sách mới.
            </p>
            {wallet.holding?.nextDeadlineAt && (
              <p>
                Hạn giữ gần nhất:{" "}
                <strong>
                  {holdingDeadline(wallet.holding.nextDeadlineAt)}
                </strong>{" "}
                (giờ Việt Nam).
                <br />
                <span className="text-muted-foreground">
                  {remaining(wallet.holding.nextDeadlineAt, now)}. Đây là hạn
                  giữ, không phải cam kết rút ngay.
                </span>
              </p>
            )}
            {wallet.holding && (wallet.balances.pending ?? 0) > 0 && (
              <p className="text-muted-foreground">
                Đã hết hạn, chờ chuyển: {wallet.holding.awaitingRelease} đơn ·
                Chưa xác minh thanh toán: {wallet.holding.unverified} đơn · Liên
                quan hoàn tiền: {wallet.holding.refundBlocked} đơn. Một đơn có
                thể đồng thời cần xác minh và xử lý hoàn tiền.
              </p>
            )}
            {!!wallet.holding?.unverified && (
              <p className="rounded-lg border p-3">
                Thời gian giữ và thời gian tra soát là hai điều kiện riêng.
                VNPAY giới hạn các lượt tra soát của cùng giao dịch cách nhau ít
                nhất 6 phút. Vì vậy, giữ 1 phút không đảm bảo số dư khả dụng sau
                đúng 1 phút.
                {wallet.holding.nextVerificationAt && (
                  <>
                    {" "}
                    Lượt tra soát sớm nhất:{" "}
                    <strong>
                      {holdingDeadline(wallet.holding.nextVerificationAt)}
                    </strong>{" "}
                    (giờ Việt Nam).
                  </>
                )}{" "}
                Sau khi xác minh thành công và hết hạn giữ, hệ thống mở doanh
                thu ở lượt xử lý tiếp theo.
              </p>
            )}
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">1. Hết thời gian giữ</strong>{" "}
              — xem giờ cụ thể trong chi tiết từng đơn.
            </li>
            <li>
              <strong className="text-foreground">
                2. Đối soát đủ điều kiện
              </strong>{" "}
              — thanh toán đã xác minh, không có hoàn tiền đang chặn; hệ thống
              bù trừ nghĩa vụ còn thiếu trước khi mở số dư.
            </li>
            <li>
              <strong className="text-foreground">3. Yêu cầu rút tiền</strong> —
              cần số dư khả dụng từ {vnd(wallet.policy.minimumWithdrawal)},
              phương thức nhận đã lưu và duyệt theo chính sách.
            </li>
            <li>
              Số dư tự cập nhật mỗi 15 giây khi trang đang mở. Có thể bấm
              <strong className="text-foreground"> Làm mới</strong> để kiểm tra
              ngay.
            </li>
          </ol>
        </div>
      </details>
    </Card>
  );
}

export function OrderHoldingHint({ order }: { order: CommerceOrder }) {
  if (order.incomeState !== "pending") return null;
  const reason = order.refundBlocked
    ? "Đang chờ xử lý hoàn tiền; chưa thể mở doanh thu."
    : order.paymentVerified === false
      ? "Đang chờ xác minh thanh toán, dù thời gian giữ có thể đã hết."
      : order.holdExpired === false
        ? "Chưa hết thời gian giữ."
        : order.paymentVerified === true && order.holdExpired === true
          ? "Đã hết hạn giữ và xác minh thanh toán; chờ lượt chuyển số dư."
          : "Sau hạn giữ vẫn cần xác minh thanh toán và kiểm tra hoàn tiền.";
  return (
    <p className="mt-1 text-xs leading-5 text-muted-foreground">
      {reason}
      {order.holdMinutes != null
        ? ` · ${formatHoldingPeriod(order.holdMinutes)}`
        : ""}
      {order.availableAt
        ? ` · Hạn giữ: ${holdingDeadline(order.availableAt)}.`
        : " Chưa có hạn giữ được xác nhận."}
      {order.paymentVerified === false && order.nextVerificationAt && (
        <>
          {" "}
          Tra soát sớm nhất: {holdingDeadline(order.nextVerificationAt)}; chưa
          phải thời điểm cam kết mở số dư.
        </>
      )}
    </p>
  );
}
