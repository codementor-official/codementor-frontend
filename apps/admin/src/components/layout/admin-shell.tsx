"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        collapsed={collapsed}
        mobile={false}
        onToggle={() => setCollapsed((value) => !value)}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Đóng lớp phủ thanh bên"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-60 shadow-[8px_0_30px_rgba(0,0,0,0.2)]">
            <AdminSidebar collapsed={false} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
