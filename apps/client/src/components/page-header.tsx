import { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** Square tile left of the title — gives every page the same anchor instead of bare text. */
  icon?: PhosphorIcon;
  /** Right-aligned action(s) on the same row as the title, e.g. a primary button or sort control. */
  actions?: ReactNode;
}) {
  return (
    // Màn hẹp: nút xuống dòng dưới tiêu đề thay vì đè lên (TC-20, 375 px). `basis-64` là
    // bề rộng tối thiểu khối chữ được giữ trước khi nhường hàng cho khối nút.
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-soft text-navy">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words text-navy">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
