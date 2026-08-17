import Link from "next/link";
import { AppTopbar } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { NotificationBell } from "@/features/notifications/notification-bell";

export function Topbar() {
  return (
    // The row used to hold one centered search box wired to nothing — 64px of height for a
    // focusable dead control. It carries the trail now, which is the one thing every page
    // needs and no page should render itself.
    <AppTopbar
      actions={<NotificationBell />}
      brand={
        // Sidebar (and its logo) is hidden below md — show the logo here instead so mobile
        // always has one.
        <Link href="/dashboard">
          <BrandLogo size="sm" priority />
        </Link>
      }
      breadcrumb={<AppBreadcrumb />}
    />
  );
}
