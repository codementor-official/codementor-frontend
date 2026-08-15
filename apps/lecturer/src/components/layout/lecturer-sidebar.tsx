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
          ? "flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
          : collapsed
            ? "fixed inset-y-0 left-0 z-30 hidden w-14 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
            : "fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
      }
    >
      {/* Collapsed drops the horizontal padding and centres instead. Keeping `px-4` while
          the rail is 56px wide is what pushed every icon off to the left. */}
      <div
        className={`flex h-12 shrink-0 items-center ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-3"
        }`}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-background">
          <Code2 aria-hidden="true" className="size-3.5" />
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

      <div className={`min-h-0 flex-1 overflow-y-auto pt-1 pb-3 ${collapsed ? "px-1.5" : "px-2"}`}>
        {lecturerNavigation.map((group) => (
          <section className="mb-3" key={group.label}>
            {!collapsed ? (
              <h2 className="mb-1 px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h2>
            ) : (
              <div aria-hidden="true" className="mx-auto mb-1.5 h-px w-5 bg-sidebar-border" />
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
                    className={`flex h-8 items-center rounded-md text-sm transition-colors ${
                      collapsed ? "justify-center px-0" : "gap-2.5 px-2"
                    } ${
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
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
            ? "m-1.5 flex h-10 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
            : "m-1.5 flex h-11 items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-sidebar-accent"
        }
        href="/profile"
        onClick={onClose}
        title={collapsed ? (user?.displayName ?? "Hồ sơ") : undefined}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-medium text-background">
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
