"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { LecturerSidebar } from "@/components/layout/lecturer-sidebar";
import { LecturerTopbar } from "@/components/layout/lecturer-topbar";

export function LecturerShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fixed viewport height rather than `min-h-screen`, because the studio and solve screens
  // are split panes: a pane can only size itself against a parent whose height is known,
  // and a page that grows with its content never gives it one. List screens get their
  // scrolling back below, on `main`.
  return (
    <div className="flex h-screen flex-col bg-background">
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

      <div
        className={`flex min-h-0 flex-1 flex-col ${collapsed ? "md:pl-18" : "md:pl-64"}`}
      >
        <LecturerTopbar
          onDesktopToggle={() => setCollapsed((value) => !value)}
          onMobileToggle={() => setMobileOpen(true)}
        />
        {/* No padding here: a split-pane screen needs to reach the edges. Pages that want
            breathing room wrap themselves in <PageBody>. */}
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
