"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@codementor/ui";
import { navItems } from "./nav-items";
import { UserMenu } from "./user-menu";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import { BrandLogo } from "@/components/brand-logo";
import { api } from "@/lib/api";

/** Web's rail: the shared shell sidebar, with this application's links and account menu. */
export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const [workspaceUnread, setWorkspaceUnread] = useState(0);
  const refreshWorkspaceUnread = useCallback(() => {
    void api.workspaces
      .summary()
      .then((summary) => setWorkspaceUnread(summary.unreadCount))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refreshWorkspaceUnread, 0);
    const interval = window.setInterval(refreshWorkspaceUnread, 30_000);
    window.addEventListener("workspace-unread-changed", refreshWorkspaceUnread);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener(
        "workspace-unread-changed",
        refreshWorkspaceUnread,
      );
    };
  }, [refreshWorkspaceUnread]);

  return (
    <AppSidebar
      activePath={pathname}
      brand={
        <Link href="/dashboard" className="block min-w-0" title="CodeMentor">
          <BrandLogo compact={collapsed} priority />
        </Link>
      }
      collapsed={collapsed}
      badges={{ "/workspace": workspaceUnread }}
      footer={<UserMenu collapsed={collapsed} />}
      // The elevated "Tạo bài tập" action used to sit above the links. Removed pending a
      // decision on whether learners may author lessons at all — see `createAction`.
      groups={[{ items: navItems }]}
      onToggle={toggle}
    />
  );
}
