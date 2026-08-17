"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppSidebar } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { adminNavigation } from "@/components/navigation/admin-navigation";
import { useAdminAuth } from "@/features/auth/auth-provider";

interface AdminSidebarProps {
  collapsed: boolean;
  mobile: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function AdminSidebar({ collapsed, mobile, onToggle, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  const compact = collapsed && !mobile;

  return (
    <AppSidebar
      activePath={pathname}
      ariaLabel="Điều hướng quản trị"
      brand={
        <Link className="flex min-w-0 items-center gap-2.5" href="/dashboard" title="CodeMentor">
          <BrandLogo size={28} />
          {!compact && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">CodeMentor</span>
              <span className="block truncate text-xs text-muted-foreground">Trang quản trị</span>
            </span>
          )}
        </Link>
      }
      collapsed={collapsed}
      footer={
        // The account block used to show a hardcoded "Alex Morgan"; it shows whoever is
        // actually signed in.
        <div
          className={`flex h-9 min-w-0 items-center gap-2.5 ${compact ? "w-9 justify-center" : "flex-1 px-1"}`}
          title={user?.displayName ?? user?.email ?? "Quản trị viên"}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <ShieldCheck aria-hidden="true" className="size-4" />
          </span>
          {!compact && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{user?.displayName ?? "Quản trị viên"}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          )}
        </div>
      }
      groups={adminNavigation}
      mobile={mobile}
      onClose={onClose}
      onToggle={onToggle}
    />
  );
}
