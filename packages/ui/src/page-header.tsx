import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** One sentence. If it needs two, the page is doing two things. */
  description?: string;
  /** Square tile left of the title — the same anchor on every screen. */
  icon?: LucideIcon;
  /** Sits between the title and the action — where a screen's tab strip belongs, so it
   * shares this row instead of stacking a third bordered block above it. */
  center?: ReactNode;
  /** The single primary action for this page. Row-level actions belong in the row. */
  action?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, center, action }: PageHeaderProps) {
  return (
    // `justify-between` cộng ba khối co giãn tự do = vị trí của dải tab phụ thuộc vào độ
    // dài tiêu đề và mô tả. Mô tả đổi theo tab đang chọn, nên mỗi lần bấm là dải tab nhảy
    // sang chỗ khác. `flex-1` cho khối chữ và `shrink-0` cho hai khối kia ghim tab + nút
    // vào mép phải, bất kể chữ bên trái dài bao nhiêu.
    <header className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-1 basis-72 items-center gap-2.5">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-4.5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={description}>
              {description}
            </p>
          )}
        </div>
      </div>
      {center && <div className="shrink-0">{center}</div>}
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
