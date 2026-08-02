"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { createAction, navItems } from "./nav-items";
import { UserMenu } from "./user-menu";
import { useSidebarStore } from "@/lib/store/sidebar-store";

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
      {/* Fixed height so collapsing (wordmark -> icon mark) doesn't shift the nav below. */}
      <div className={`mb-3 flex h-9 shrink-0 items-center ${collapsed ? "justify-center" : ""}`}>
        <Link href="/dashboard" className="min-w-0" title="CodeMentor">
          <Image
            src="/logo.png"
            alt="CodeMentor"
            width={460}
            height={159}
            priority
            /* Collapsed: crop to the leftmost square of the asset, which is the icon mark
             * (the wordmark starts past it) — avoids shipping a second logo file. */
            className={collapsed ? "h-8 w-8 object-cover object-left" : "h-7 w-auto"}
          />
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
