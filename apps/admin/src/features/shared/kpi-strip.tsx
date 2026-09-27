import type { LucideIcon } from "lucide-react";
import { Card } from "@codementor/ui";

export interface Kpi {
  icon: LucideIcon;
  label: string;
  /** `null` = không lấy được số. Hiện "—", không hiện 0: số thiếu khác số bằng không. */
  value: number | null;
}

// Tailwind chỉ sinh class viết nguyên văn trong mã nguồn, nên không ghép chuỗi động được.
const XL_COLS: Record<number, string> = {
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

/**
 * Dải số tổng quan phía trên bảng quản lý. Gọn hơn `MetricStrip` của dashboard có chủ
 * đích: ở đây bảng mới là nội dung chính, dải số không được ăn mất chỗ của nó.
 *
 * Viền giữa các ô là nền `bg-border` lộ qua `gap-px`, nên đổi số cột theo màn hình không
 * phải tính lại ô nào có viền phải/viền dưới.
 */
export function KpiStrip({ metrics, loading = false }: { metrics: Kpi[]; loading?: boolean }) {
  return (
    <Card
      className={`grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-3 ${XL_COLS[metrics.length] ?? "xl:grid-cols-6"}`}
    >
      {metrics.map(({ icon: Icon, label, value }) => (
        <div className="min-w-0 bg-card px-3 py-2.5" key={label}>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{label}</span>
          </div>
          {/* Cao cố định cả lúc đang tải để bảng bên dưới không nhảy khi số về. */}
          <p className="mt-1 h-7 text-lg font-semibold tabular-nums tracking-tight">
            {loading ? (
              <span className="block h-5 w-12 animate-pulse rounded bg-muted" />
            ) : value === null ? (
              "—"
            ) : (
              value.toLocaleString("vi-VN")
            )}
          </p>
        </div>
      ))}
    </Card>
  );
}
