"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppTopbar, Breadcrumb, NotificationBell, ThemeMenu } from "@codementor/ui";
import type { NotificationSource } from "@codementor/ui";
import { breadcrumbFor } from "@/components/navigation/route-meta";
import { useAdminAuth } from "@/features/auth/auth-provider";
import { useAdminApi } from "@/features/auth/admin-api";
import { notificationsApi } from "@/lib/api";
import { realtimeUrl } from "@/lib/env";

/**
 * Trail, notifications, theme, sign out — the same row the other two applications render.
 *
 * The bell is back, and this time it counts something: a lecturer submitting content for
 * review raises a notification addressed to the `admin` role. The ⌘K palette that used to
 * sit beside it is still gone — it listed three labels that navigated nowhere.
 *
 * The handshake ticket comes from `/api/auth/realtime-token` because this session keeps
 * its tokens in an HttpOnly cookie; the browser never holds one.
 */
export function AdminTopbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { logout, user, authenticated } = useAdminAuth();
  const request = useAdminApi();
  const pathname = usePathname();

  const notifications: NotificationSource = {
    list: (params) => notificationsApi.list(request, params),
    unreadCount: async () => (await notificationsApi.unreadCount(request)).count,
    markRead: async (id) => {
      await notificationsApi.markRead(request, id);
    },
    markAllRead: async () => {
      await notificationsApi.markAllRead(request);
    },
    realtimeToken: async () => {
      const response = await fetch("/api/auth/realtime-token", { cache: "no-store" });
      if (!response.ok) return null;
      return ((await response.json()) as { token: string }).token;
    },
    realtimeUrl,
  };

  return (
    <AppTopbar
      actions={
        <>
          <NotificationBell
            emptyHint="Nội dung giảng viên gửi duyệt sẽ xuất hiện ở đây."
            enabled={authenticated}
            source={notifications}
          />
          <ThemeMenu storageKey="codementor-admin-theme" />
          <button
            aria-label={`Đăng xuất ${user?.displayName ?? user?.email ?? "quản trị viên"}`}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
          </button>
        </>
      }
      breadcrumb={<Breadcrumb items={breadcrumbFor(pathname)} />}
      onMobileMenu={onMobileMenu}
    />
  );
}
