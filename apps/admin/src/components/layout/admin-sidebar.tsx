"use client";

import { ChevronsUpDown, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { adminNavigation } from "@/components/navigation/admin-navigation";

interface AdminSidebarProps {
  collapsed: boolean;
  mobile: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ collapsed, mobile, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Điều hướng quản trị"
      className={
        mobile
          ? "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
          : collapsed
            ? "fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
            : "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
      }
    >
      <div className="flex h-16 shrink-0 items-center gap-3 px-4">
        <BrandLogo size={36} />
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">CodeMentor</p>
            <p className="truncate text-xs text-muted-foreground">Admin Console</p>
          </div>
        )}
        {mobile && (
          <button
            aria-label="Đóng thanh bên"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {adminNavigation.map((group) => (
          <section className="mb-5" key={group.label}>
            {!collapsed ? (
              <h2 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h2>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" aria-hidden="true" />
            )}
            <nav aria-label={group.label} className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
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

      <button
        className={
          collapsed
            ? "m-2 flex h-12 items-center justify-center rounded-lg border border-transparent transition-colors hover:bg-sidebar-accent"
            : "m-2 flex h-14 items-center gap-3 rounded-lg border border-transparent px-2 text-left transition-colors hover:bg-sidebar-accent"
        }
        title={collapsed ? "Tài khoản quản trị" : undefined}
        type="button"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </div>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">Alex Morgan</span>
              <span className="block truncate text-xs text-muted-foreground">admin@codementor.dev</span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 text-muted-foreground" />
          </>
        )}
      </button>
    </aside>
  );
}
