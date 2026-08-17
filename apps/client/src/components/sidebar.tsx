"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@codementor/ui";
import { navItems } from "./nav-items";
import { UserMenu } from "./user-menu";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import { BrandLogo } from "@/components/brand-logo";

/** Web's rail: the shared shell sidebar, with this application's links and account menu. */
export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <AppSidebar
      activePath={pathname}
      brand={
        <Link href="/dashboard" className="block min-w-0" title="CodeMentor">
          <BrandLogo compact={collapsed} priority />
        </Link>
      }
      collapsed={collapsed}
      footer={<UserMenu collapsed={collapsed} />}
      // The elevated "Tạo bài tập" action used to sit above the links. Removed pending a
      // decision on whether learners may author lessons at all — see `createAction`.
      groups={[{ items: navItems }]}
      onToggle={toggle}
    />
  );
}
