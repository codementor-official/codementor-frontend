import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { NotificationBell } from "@/features/notifications/notification-bell";

export function Topbar() {
  return (
    // The row used to hold one centered search box wired to nothing — 64px of height for a
    // focusable dead control. It carries the trail now, which is the one thing every page
    // needs and no page should render itself.
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      {/* Sidebar (and its logo) is hidden below md — show the logo here instead so mobile
       * always has one. */}
      <Link href="/dashboard" className="shrink-0 md:hidden">
        <BrandLogo size="sm" priority />
      </Link>
      <AppBreadcrumb />
      {/* Đẩy chuông sang phải: breadcrumb chiếm phần còn lại của hàng. */}
      <div className="ml-auto shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
