"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { ModerationQueueProvider } from "@/features/moderation/queue-provider";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Hàng chờ đọc một lần ở đây rồi dùng chung: thanh bên cần con số trên MỌI trang, còn
    // màn kiểm duyệt cần chính những hàng đó — hai lần gọi thì hai bên lệch nhau ngay sau
    // cú bấm duyệt đầu tiên.
    <ModerationQueueProvider>
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
            className="absolute inset-0 bg-ink-fixed/50"
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
    </ModerationQueueProvider>
  );
}
