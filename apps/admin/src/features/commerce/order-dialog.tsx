"use client";
import { useState } from "react";
import { Button, Modal } from "@codementor/ui";
import { Printer } from "lucide-react";
import { inputClassName } from "./form-style";
import { COMMERCE_STATUS, type PurchaseDetail } from "@codementor/types";
import { vnd } from "./api";
export function OrderDialog({
  order,
  close,
  command,
  busy,
}: {
  order: PurchaseDetail;
  close: () => void;
  command: (path: string, body?: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal open onClose={close} title="Chi tiết đơn hàng" width="lg">
      <div id="admin-order-invoice" className="space-y-4 text-sm">
        <h3 className="font-semibold">{order.courseTitle}</h3>
        <p className="break-all text-xs text-muted-foreground">{order.id}</p>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Người mua", `${order.buyer?.name ?? "Học viên"}${order.buyer?.email ? ` · ${order.buyer.email}` : ""}`],
            ["Thời điểm mua", new Date(order.createdAt).toLocaleString("vi-VN")],
            ["Học viên trả", vnd(order.amount)],
            [
              "Giảng viên",
              `${vnd(order.instructorAmount)} (${order.instructorBps / 100}%)`,
            ],
            ["CodeMentor", vnd(order.platformAmount)],
            [
              "Phí cổng",
              order.feeAmount === null
                ? "Chưa xác định"
                : `${vnd(order.feeAmount)} · ${order.feeSource === "simulated" ? "Hệ thống" : "Cổng thanh toán"}`,
            ],
            ["Trạng thái", COMMERCE_STATUS[order.status]],
            [
              "Thanh toán",
              `${order.payment.provider === "mock" ? "Thanh toán trực tuyến" : order.payment.provider.toUpperCase()} · ${COMMERCE_STATUS[order.payment.status] ?? order.payment.status}`,
            ],
          ].map(([l, v]) => (
            <div key={l}>
              <dt className="text-xs text-muted-foreground">{l}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Dòng tiền của đơn được ghi nhận trong sổ kế toán nội bộ và cập nhật
          sau mỗi lần đối soát.
        </p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Xuất hóa đơn</Button><Button variant="outline" disabled={busy} onClick={() => void command(`orders/${order.id}/reconcile`)}>Kiểm tra trạng thái thanh toán</Button></div>
        {order.refund ? (
          <div className="rounded-md border p-3">
            <p>Hoàn tiền: {COMMERCE_STATUS[order.refund.status]}</p>
            <p className="text-muted-foreground">{order.refund.reason}</p>
            {["pending", "unknown"].includes(order.refund.status) && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void command(`refunds/${order.refund!.id}/reconcile`)
                  }
                >
                  Kiểm tra trạng thái hoàn tiền
                </Button>
                {order.mode === "mock" &&
                  ["success", "failure"].map((result) => (
                    <Button
                      key={result}
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void command(
                          `refunds/${order.refund!.id}/mock-result`,
                          { result },
                        )
                      }
                    >
                      {result === "success" ? "Xác nhận hoàn tiền thành công" : "Ghi nhận hoàn tiền thất bại"}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        ) : (
          ["paid", "review"].includes(order.status) && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">
                Hoàn toàn bộ {vnd(order.amount)}
              </h4>
              <p className="text-xs text-muted-foreground">
                Chưa hỗ trợ hoàn một phần. Thu hồi quyền của giao dịch sau khi
                xác nhận thành công; không xóa quyền độc lập.
              </p>
              <label className="block">
                Lý do
                <textarea
                  className={`${inputClassName} mt-1 min-h-20`}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                Tôi xác nhận hoàn toàn bộ và thu hồi quyền học từ đơn hàng này
              </label>
              <Button
                variant="danger"
                disabled={busy || !confirm || reason.trim().length < 5}
                onClick={() =>
                  void command(`orders/${order.id}/refund`, { reason })
                }
              >
                Xác nhận hoàn tiền
              </Button>
            </div>
          )
        )}
      </div>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #admin-order-invoice, #admin-order-invoice * { visibility: visible !important; } #admin-order-invoice { position: absolute; inset: 0; padding: 32px; background: white; color: black; } }`}</style>
    </Modal>
  );
}
