"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { LecturerSidebar } from "@/components/layout/lecturer-sidebar";
import { LecturerTopbar } from "@/components/layout/lecturer-topbar";

export function LecturerShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <LecturerSidebar collapsed={collapsed} mobile={false} />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Đóng lớp phủ menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-64 shadow-[8px_0_30px_rgba(0,0,0,0.2)]">
            <LecturerSidebar collapsed={false} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={collapsed ? "min-h-screen md:pl-[72px]" : "min-h-screen md:pl-64"}>
        <LecturerTopbar
          onDesktopToggle={() => setCollapsed((value) => !value)}
          onMobileToggle={() => setMobileOpen(true)}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
