"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { lecturerNavigation } from "@/components/navigation/lecturer-navigation";
import { useAuth } from "@/providers/auth-provider";

interface LecturerSidebarProps {
  collapsed: boolean;
  mobile: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function LecturerSidebar({ collapsed, mobile, onToggle, onClose }: LecturerSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const compact = collapsed && !mobile;

  return (
    <AppSidebar
      activePath={pathname}
      ariaLabel="Điều hướng giảng viên"
      brand={
        <Link className="flex min-w-0 items-center gap-2.5" href="/dashboard" title="CodeMentor">
          <BrandLogo size={28} />
          {!compact && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">CodeMentor</span>
              <span className="block truncate text-xs text-muted-foreground">Trang giảng viên</span>
            </span>
          )}
        </Link>
      }
      collapsed={collapsed}
      footer={
        <Link
          className={`flex h-9 min-w-0 items-center gap-2.5 rounded-md hover:bg-sidebar-accent ${
            compact ? "w-9 justify-center" : "flex-1 px-1"
          }`}
          href="/profile"
          onClick={onClose}
          title={user?.displayName ?? "Hồ sơ"}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-medium text-background">
            {(user?.displayName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
          {!compact && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium">{user?.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
            </span>
          )}
        </Link>
      }
      groups={lecturerNavigation}
      mobile={mobile}
      onClose={onClose}
      onToggle={onToggle}
    />
  );
}
