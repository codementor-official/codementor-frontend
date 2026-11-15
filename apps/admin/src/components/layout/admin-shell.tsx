"use client";

import type { ReactNode } from "react";
import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { ModerationQueueProvider } from "@/features/moderation/queue-provider";

/** Read-only course / roadmap studio routes, laid out like the lecturer studio. */
const STUDIO = /^\/(courses|learning-paths)\/[^/]+$/;

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    // Hàng chờ đọc một lần ở đây rồi dùng chung: thanh bên cần con số trên MỌI trang, còn
    // màn kiểm duyệt cần chính những hàng đó — hai lần gọi thì hai bên lệch nhau ngay sau
    // cú bấm duyệt đầu tiên.
    <ModerationQueueProvider>
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar onMobileMenu={() => setMobileOpen(true)} />
        {/* Studio screens are split panes and need the edges; every other page keeps its padding. */}
        <main className={`min-h-0 flex-1 ${STUDIO.test(pathname) ? "overflow-hidden" : "overflow-y-auto p-3 sm:p-4 md:p-6"}`}>
          {/* useUrlState (useSearchParams) on list screens needs a boundary above it. */}
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
    </ModerationQueueProvider>
  );
}
