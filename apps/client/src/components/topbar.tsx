"use client";

import Link from "next/link";
import { useState } from "react";
import { AppTopbar } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/features/notifications/notification-bell";

export function Topbar() {
  // Below md the rail is hidden; without this drawer a phone had no way to change page.
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      {/* The row used to hold one centered search box wired to nothing — 64px of height for a
          focusable dead control. It carries the trail now, which is the one thing every page
          needs and no page should render itself. */}
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
        onMobileMenu={() => setMobileOpen(true)}
      />
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Đóng lớp phủ menu"
            className="absolute inset-0 bg-ink-fixed/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-60 shadow-[8px_0_30px_rgba(0,0,0,0.2)]">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
