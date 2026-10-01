"use client";
import { apiErrorMessage } from "@codementor/api-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { CoursePrice, useToast } from "@codementor/ui";
import type { CommerceConfig, PaymentMethod } from "@codementor/types";
import { Button } from "@/components/ui/button";
import { commerceApi } from "./api";
export function PurchaseButton({
  courseId,
  price,
  listPrice,
  promotionLabel,
}: {
  courseId: string;
  price: number;
  listPrice?: number;
  promotionLabel?: string | null;
}) {
  const [config, setConfig] = useState<CommerceConfig | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("mock");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    void commerceApi
      .config()
      .then((c) => {
        setConfig(c);
        if (c.methods[0]) setMethod(c.methods[0]);
      })
      .catch(() => setError("Không tải được phương thức thanh toán."));
  }, []);
  async function buy() {
    setBusy(true);
    try {
      const o = await commerceApi.create(courseId, method);
      // Provider nội bộ hoàn tất ngay để luồng người học giống một cổng thanh toán thật:
      // bấm thanh toán một lần, sau đó nhận kết quả trên trang đơn hàng.
      if (method === "mock") await commerceApi.mock(o.id, "success");
      router.push(`/purchases/${o.id}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      {promotionLabel && <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{promotionLabel}</span>}
      <div className="flex items-baseline gap-2"><CoursePrice className="text-xl" priceVnd={price} listPriceVnd={listPrice} /><span className="text-xs text-text-muted">/ mua một lần</span></div>
      <p className="text-xs text-text-muted">
        Thanh toán một lần để mở quyền truy cập toàn bộ khóa học.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {config && config.methods.length === 0 && (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-text-muted">
          Cổng thanh toán đang được cấu hình. Giá và ưu đãi vẫn được giữ nguyên; bạn có thể quay lại thanh toán khi VNPay hoặc MoMo được kích hoạt.
        </p>
      )}
      {config && config.methods.length > 1 && (
        <label className="block text-xs text-text-muted">
          Phương thức
          <select
            className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-text"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {config.methods.map((m) => (
              <option key={m} value={m}>
                {m === "mock" ? "Thanh toán trực tuyến" : m.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      )}
      <Button
        className="w-full"
        disabled={busy || !config?.methods.length}
        onClick={() => void buy()}
      >
        <CreditCard className="size-4" />
        {busy
          ? "Đang tạo đơn…"
          : config === null
            ? "Đang tải phương thức…"
          : config?.methods.length === 0
            ? "Cổng thanh toán chưa sẵn sàng"
            : "Thanh toán khóa học"}
      </Button>
    </div>
  );
}
