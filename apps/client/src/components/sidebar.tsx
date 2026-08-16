"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { createAction, navItems } from "./nav-items";
import { UserMenu } from "./user-menu";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import { BrandLogo } from "@/components/brand-logo";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-border bg-surface p-3 transition-[width] duration-150 md:flex ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`mb-4 flex h-12 shrink-0 items-center ${collapsed ? "justify-center" : "px-1"}`}>
        <Link href="/dashboard" className="block min-w-0" title="CodeMentor">
          <BrandLogo compact={collapsed} priority />
        </Link>
      </div>

      <Link
        href={createAction.href}
        title={collapsed ? createAction.label : undefined}
        className={`mb-3 flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-navy hover:border-navy hover:bg-bg ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Plus className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{createAction.label}</span>}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                collapsed ? "justify-center" : ""
              } ${active ? "bg-bg text-navy" : "text-text-muted hover:bg-bg hover:text-navy"}`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={`flex shrink-0 items-center gap-2 border-t border-border-soft pt-3 ${
          collapsed ? "flex-col" : ""
        }`}
      >
        <UserMenu collapsed={collapsed} />
        <button
          onClick={toggle}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-faint hover:bg-bg hover:text-navy"
        >
          {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
        </button>
      </div>
    </aside>
  );
}
