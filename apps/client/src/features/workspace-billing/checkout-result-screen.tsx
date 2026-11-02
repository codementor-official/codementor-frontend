"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Printer, RefreshCw, XCircle } from "lucide-react";
import { apiErrorMessage } from "@codementor/api-client";
import { useToast } from "@codementor/ui";
import type { WorkspaceOrderDetail } from "@codementor/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { billingApi } from "./api";
import { OrderStatus } from "./billing-screen";
import { Invoice } from "./invoice";

const POLL_MS = 3000;
const POLL_LIMIT = 40;

/**
 * Reads the order from the server, never from the gateway's redirect parameters: the page says
 * "paid" only after the backend verified the payment.
 */
export function CheckoutResultScreen() {
  const orderId = useSearchParams().get("order") ?? "";
  const toast = useToast();
  const [order, setOrder] = useState<WorkspaceOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const polls = useRef(0);

  const load = useCallback(() => {
    if (!orderId) return;
    billingApi
      .order(orderId)
      .then(setOrder)
      .catch((e) => setError(apiErrorMessage(e)));
  }, [orderId]);
  useEffect(load, [load]);
  const shownError = orderId ? error : "Không có mã giao dịch.";

  useEffect(() => {
    if (order?.status !== "pending" || polls.current >= POLL_LIMIT) return;
    const timer = setTimeout(() => {
      polls.current++;
      load();
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [order, load]);

  async function run(action: () => Promise<WorkspaceOrderDetail>) {
    setBusy(true);
    try {
      setOrder(await action());
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const paid = order?.status === "paid";
  const pending = order?.status === "pending";

  return (
    <>
      <PageHeader title="Giao dịch & hoá đơn" subtitle={order ? `Mã giao dịch ${order.id.slice(0, 8).toUpperCase()}` : undefined} />
      {shownError && (
        <Card className="p-5 text-sm text-danger" role="alert">
          {shownError}
        </Card>
      )}
      {!order && !shownError && <Card className="h-48 animate-pulse" aria-hidden />}
      {order && (
        <Card className="p-6">
          <div className="flex flex-wrap items-start gap-4">
            {paid ? (
              <CheckCircle2 className="h-10 w-10 shrink-0 text-success" aria-hidden />
            ) : pending || order.status === "review" ? (
              <Clock className="h-10 w-10 shrink-0 text-primary" aria-hidden />
            ) : (
              <XCircle className="h-10 w-10 shrink-0 text-danger" aria-hidden />
            )}
            <div className="min-w-0 flex-1" aria-live="polite">
              <h2 className="text-xl font-bold text-navy">{HEADLINE[order.status]}</h2>
              <p className="mt-1 text-sm text-text-muted">{DETAIL[order.status]}</p>
            </div>
            <OrderStatus status={order.status} />
          </div>

          <Invoice order={order} />

          <div className="mt-6 flex flex-wrap gap-2">
            {pending && order.payment.checkoutUrl && (
              <Button href={order.payment.checkoutUrl}>Tiếp tục thanh toán</Button>
            )}
            {pending && order.mode === "mock" && (
              <>
                <Button disabled={busy} onClick={() => run(() => billingApi.mock(order.id, "success"))}>
                  Giả lập thành công
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => run(() => billingApi.mock(order.id, "failure"))}>
                  Giả lập thất bại
                </Button>
              </>
            )}
            {(pending || order.status === "review") && order.mode !== "mock" && (
              <Button variant="outline" disabled={busy} onClick={() => run(() => billingApi.reconcile(order.id))}>
                <RefreshCw className="h-4 w-4" /> Kiểm tra lại với cổng thanh toán
              </Button>
            )}
            {(paid || order.status === "refunded") && (
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> In / lưu PDF
              </Button>
            )}
            <Button href="/workspace/billing" variant={paid ? "primary" : "outline"}>
              Về trang gói & thanh toán
            </Button>
            {!paid && !pending && (
              <Button href="/workspace/pricing" variant="ghost">
                Chọn lại gói
              </Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

const HEADLINE: Record<WorkspaceOrderDetail["status"], string> = {
  pending: "Đang chờ xác nhận thanh toán",
  paid: "Gói đã được kích hoạt",
  failed: "Thanh toán không thành công",
  cancelled: "Giao dịch đã huỷ",
  expired: "Giao dịch đã hết hạn",
  review: "Thanh toán đang được kiểm tra",
  refunded: "Giao dịch đã hoàn tiền",
};

const DETAIL: Record<WorkspaceOrderDetail["status"], string> = {
  pending: "Trang tự cập nhật khi cổng thanh toán xác nhận. Bạn có thể đóng trang; gói vẫn được kích hoạt sau khi xác nhận.",
  paid: "Hạn mức mới đã có hiệu lực cho mọi nhóm bạn sở hữu.",
  failed: "Bạn chưa bị trừ tiền cho giao dịch này. Có thể thử lại với phương thức khác.",
  cancelled: "Không có khoản tiền nào được ghi nhận.",
  expired: "Giao dịch quá thời hạn thanh toán. Hãy tạo giao dịch mới nếu bạn vẫn muốn mua gói.",
  review: "Chúng tôi đã nhận tiền nhưng cần quản trị viên kiểm tra trước khi áp dụng. Bạn sẽ nhận thông báo khi có kết quả.",
  refunded: "Khoản thanh toán đã được hoàn lại. Xem bên dưới gói của bạn thay đổi thế nào.",
};
