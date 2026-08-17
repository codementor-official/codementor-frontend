import { Trash2, TriangleAlert } from "lucide-react";
import { ConfirmButton } from "@/components/page/confirm-button";

/**
 * Khối cuối trang studio cho thao tác không lùi lại được.
 *
 * Nút xoá từng là một nút chữ mờ đứng lẫn trong hàng nút bình thường: cùng cỡ, cùng màu
 * với "Lưu". Ở đây nó có viền đỏ riêng, một câu nói rõ chuyện gì sẽ xảy ra, và một hộp
 * xác nhận trước khi chạy — nổi bật để không bấm nhầm, hỏi lại để không xoá tình cờ.
 */
export function DangerZone({
  title,
  description,
  actionLabel,
  confirmTitle,
  confirmDescription,
  onConfirm,
  disabled,
}: {
  title: string;
  description: string;
  actionLabel: string;
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => void | Promise<unknown>;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {title}
      </h2>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 max-w-xl text-sm text-muted-foreground">{description}</p>
        <ConfirmButton
          confirmLabel={actionLabel}
          description={confirmDescription}
          disabled={disabled}
          onConfirm={onConfirm}
          title={confirmTitle}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {actionLabel}
        </ConfirmButton>
      </div>
    </section>
  );
}
