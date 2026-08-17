"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} mobile={false} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Đóng lớp phủ thanh bên"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-64 shadow-[8px_0_30px_rgba(0,0,0,0.2)]">
            <AdminSidebar collapsed={false} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={collapsed ? "min-h-screen md:pl-[72px]" : "min-h-screen md:pl-64"}>
        <AdminTopbar
          onDesktopToggle={() => setCollapsed((value) => !value)}
          onMobileToggle={() => setMobileOpen(true)}
        />
        <main className="min-h-[calc(100vh-69px)] p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
