import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { InfoHint } from "@/components/form/info-hint";

/**
 * Hàng tiêu đề của một thẻ trong studio: icon, tên thẻ, dấu hỏi giải thích, và chỗ cho
 * một nút bên phải. Mọi thẻ dùng chung một hình dạng để mắt nhận ra ranh giới thẻ mà
 * không phải đọc chữ.
 */
export function CardHeading({
  icon: Icon,
  title,
  hint,
  action,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  /** Mô tả thẻ. Vào tooltip thay vì một đoạn xám luôn hiện dưới tiêu đề. */
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        {title}
        {hint && <InfoHint text={hint} />}
      </h2>
      {action}
    </div>
  );
}
