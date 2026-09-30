import type { ReactNode } from "react";
import { Sparkles, TicketPercent } from "lucide-react";

export function formatVndPrice(value: number) {
  return value <= 0
    ? "Miễn phí"
    : `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}

export function CoursePrice({
  priceVnd,
  listPriceVnd,
  className = "",
}: {
  priceVnd: number;
  listPriceVnd?: number | null;
  className?: string;
}) {
  const discounted = Boolean(
    listPriceVnd && listPriceVnd > priceVnd && priceVnd > 0,
  );
  return (
    <span className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <strong className={priceVnd === 0 ? "text-success" : "text-primary"}>
        {formatVndPrice(priceVnd)}
      </strong>
      {discounted && (
        <span className="text-2xs text-text-faint line-through">
          {formatVndPrice(listPriceVnd ?? priceVnd)}
        </span>
      )}
    </span>
  );
}

export function CoursePriceBadges({
  priceVnd,
  discountPercent = 0,
  promotionLabel,
}: {
  priceVnd: number;
  discountPercent?: number;
  promotionLabel?: string | null;
}): ReactNode {
  if (priceVnd === 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-2.5 py-1.5 font-sans text-xs font-semibold leading-none text-foreground shadow-lg backdrop-blur-md">
        <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
          <Sparkles aria-hidden="true" className="size-3.5" />
        </span>
        Học miễn phí
      </span>
    );
  }
  if (!discountPercent) return null;
  return (
    <span
      className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-border/80 bg-card/95 p-1.5 pr-2 font-sans text-foreground shadow-lg backdrop-blur-md"
      title={`${promotionLabel || "Đang ưu đãi"} · Giảm ${discountPercent}%`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <TicketPercent aria-hidden="true" className="size-4" />
      </span>
      <span className="max-w-48 whitespace-normal text-2xs leading-tight font-semibold text-foreground">
        {promotionLabel || "Đang ưu đãi"}
      </span>
      <span className="shrink-0 rounded-full bg-foreground px-2 py-1 text-2xs leading-none font-bold text-background tabular-nums">
        -{discountPercent}%
      </span>
    </span>
  );
}
