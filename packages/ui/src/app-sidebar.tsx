"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Số việc đang chờ ở màn hình đó. `0` hoặc bỏ trống thì không vẽ gì.
   *
   * Chỉ dùng cho thứ CÓ NGƯỜI PHẢI XỬ LÝ, không phải để khoe kích cỡ dữ liệu: một con
   * số đỏ trên mọi mục là một con số đỏ không ai còn nhìn.
   */
  badge?: number;
}

/** `label` omitted renders an ungrouped run of links — what a flat nav wants. */
export interface AppNavGroup {
  label?: string;
  items: AppNavItem[];
}

export interface AppSidebarProps {
  groups: AppNavGroup[];
  /**
   * Số việc đang chờ theo `href`. Truyền riêng chứ không nhét vào `groups`: danh sách
   * điều hướng là hằng số khai một lần, còn con số thì đổi mỗi lần tải lại.
   */
  badges?: Record<string, number>;
  /**
   * `usePathname()`. Khớp theo tiền tố, nên /courses/123/studio vẫn làm sáng "Khóa học".
   * Khi nhiều mục cùng khớp — /moderation và /moderation/exercises — chỉ mục KHỚP DÀI
   * NHẤT sáng: làm sáng cả hai thì thanh bên nói người dùng đang ở hai chỗ cùng lúc.
   */
  activePath: string;
  collapsed?: boolean;
  /** Absent hides the collapse control — a sidebar with no width to give. */
  onToggle?: () => void;
  /** Logo/wordmark block at the top. */
  brand?: ReactNode;
  /** Account block in the footer row, left of the collapse toggle. */
  footer?: ReactNode;
  /** Set for the mobile drawer copy: full height, always expanded, closeable. */
  mobile?: boolean;
  onClose?: () => void;
  ariaLabel?: string;
}

/**
 * The one sidebar all three applications render.
 *
 * They had three: same links-with-icons rail, three widths, three active-state colours,
 * and a collapse control that lived in the sidebar in one app and in the topbar in the
 * other two. Colours come from the `--sidebar*` tokens, so each application still looks
 * like itself without owning a copy of the markup.
 */
export function AppSidebar({
  groups,
  badges,
  activePath,
  collapsed = false,
  onToggle,
  brand,
  footer,
  mobile = false,
  onClose,
  ariaLabel = "Điều hướng",
}: AppSidebarProps) {
  // The drawer copy is never collapsed: it is already an explicit, temporary surface.
  const narrow = collapsed && !mobile;

  // Mục đang đứng: trong các mục khớp tiền tố, lấy đường dẫn dài nhất.
  const activeHref = groups
    .flatMap((group) => group.items)
    .map((item) => item.href)
    .filter((href) => activePath === href || activePath.startsWith(href + "/"))
    .sort((left, right) => right.length - left.length)[0];

  return (
    <aside
      aria-label={ariaLabel}
      className={`shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground ${
        mobile ? "flex h-full w-60" : `hidden md:flex ${narrow ? "w-16" : "w-60"}`
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border ${
          narrow ? "justify-center px-0" : "px-3"
        }`}
      >
        {brand}
        {mobile && onClose && (
          <button
            aria-label="Đóng menu"
            className="ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto py-3 ${narrow ? "px-1.5" : "px-2"}`}>
        {groups.map((group, index) => (
          <section className="mb-3 last:mb-0" key={group.label ?? index}>
            {group.label &&
              (narrow ? (
                <div aria-hidden="true" className="mx-auto mb-1.5 h-px w-5 bg-sidebar-border" />
              ) : (
                <h2 className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </h2>
              ))}
            <nav aria-label={group.label} className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.href === activeHref;
                const Icon = item.icon;
                const badge = badges?.[item.href] ?? item.badge ?? 0;
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-9 items-center rounded-md text-sm transition-colors ${
                      narrow ? "justify-center px-0" : "gap-2.5 px-2.5"
                    } ${
                      active
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                    href={item.href}
                    key={item.href}
                    onClick={onClose}
                    title={narrow ? item.label : undefined}
                  >
                    <Icon aria-hidden="true" className="size-4.5 shrink-0" strokeWidth={1.8} />
                    {!narrow && <span className="truncate">{item.label}</span>}
                    {badge > 0 &&
                      (narrow ? (
                        // Thu gọn thì không còn chỗ cho con số — chấm cam ở góc biểu tượng
                        // vẫn nói được "có việc", và đó là phần quan trọng hơn.
                        <span
                          aria-label={`${badge} mục đang chờ`}
                          className="notification-badge absolute top-1.5 right-2.5 size-2 rounded-full"
                        />
                      ) : (
                        <span className="notification-badge ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-2xs font-bold">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ))}
                  </Link>
                );
              })}
            </nav>
          </section>
        ))}
      </div>

      {(footer || onToggle) && (
        <div
          className={`flex shrink-0 items-center gap-2 border-t border-sidebar-border p-2 ${
            narrow ? "flex-col" : ""
          }`}
        >
          {footer}
          {/* The collapse control belongs next to the thing it collapses. In the topbar it
            * read as a control over the page, and the page is not what moves. */}
          {onToggle && !mobile && (
            <button
              aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={onToggle}
              title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              type="button"
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden="true" className="size-4.5" />
              ) : (
                <PanelLeftClose aria-hidden="true" className="size-4.5" />
              )}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
