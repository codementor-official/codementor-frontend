"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppTopbar, Breadcrumb, NotificationBell, ThemeMenu, useBreadcrumbTitles } from "@codementor/ui";
import type { NotificationSource } from "@codementor/ui";
import { breadcrumbFor } from "@/components/navigation/route-meta";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { realtimeUrl } from "@/lib/env";

/**
 * Trail, notifications, theme, sign out. Still no search box — nothing is behind it, and
 * a control that never does anything teaches people to ignore the whole bar.
 *
 * The collapse toggle moved to the sidebar footer, where the thing it collapses is.
 */
export function LecturerTopbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { signOut, status, realtimeToken } = useAuth();
  const pathname = usePathname();
  const breadcrumbTitles = useBreadcrumbTitles();

  const notifications: NotificationSource = {
    list: (params) => api.notifications.list(params),
    unreadCount: async () => (await api.notifications.unreadCount()).count,
    markRead: async (id) => {
      await api.notifications.markRead(id);
    },
    markAllRead: async () => {
      await api.notifications.markAllRead();
    },
    realtimeToken,
    realtimeUrl,
  };

  return (
    <AppTopbar
      actions={
        <>
          <NotificationBell
            emptyHint="Kết quả duyệt nội dung của bạn sẽ xuất hiện ở đây."
            enabled={status === "authenticated"}
            source={notifications}
          />
          <ThemeMenu storageKey="codementor-lecturer-theme" />
          <button
            aria-label="Đăng xuất"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
          </button>
        </>
      }
      breadcrumb={<Breadcrumb items={breadcrumbFor(pathname, breadcrumbTitles)} />}
      onMobileMenu={onMobileMenu}
    />
  );
}
