"use client";

import { Code2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { lecturerNavigation } from "@/components/navigation/lecturer-navigation";
import { useAuth } from "@/providers/auth-provider";

interface LecturerSidebarProps {
  collapsed: boolean;
  mobile: boolean;
  onClose?: () => void;
}

export function LecturerSidebar({ collapsed, mobile, onClose }: LecturerSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      aria-label="Điều hướng giảng viên"
      className={
        mobile
          ? "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
          : collapsed
            ? "fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
            : "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
      }
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-background">
          <Code2 aria-hidden="true" className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">CodeMentor</p>
            <p className="truncate text-xs text-muted-foreground">Trang giảng viên</p>
          </div>
        )}
        {mobile && (
          <button
            aria-label="Đóng menu"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {lecturerNavigation.map((group) => (
          <section className="mb-5" key={group.label}>
            {!collapsed ? (
              <h2 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>
            ) : (
              <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <nav aria-label={group.label} className="space-y-0.5">
              {group.items.map((item) => {
                // Prefix match so /courses/new keeps Khóa học highlighted, but the
                // dashboard at "/dashboard" does not swallow every other route.
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex h-8 items-center gap-3 rounded-md bg-sidebar-accent px-2 text-sm font-medium text-sidebar-accent-foreground"
                        : "flex h-8 items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                    href={item.href}
                    key={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </section>
        ))}
      </div>

      <Link
        className={
          collapsed
            ? "m-2 flex h-12 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent"
            : "m-2 flex h-14 items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-sidebar-accent"
        }
        href="/profile"
        onClick={onClose}
        title={collapsed ? (user?.displayName ?? "Hồ sơ") : undefined}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background">
          {(user?.displayName ?? "?").trim().charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user?.displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </span>
        )}
      </Link>
    </aside>
  );
}
