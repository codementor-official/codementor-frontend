"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppTopbar, Breadcrumb, ThemeMenu } from "@codementor/ui";
import { breadcrumbFor } from "@/components/navigation/route-meta";
import { useAdminAuth } from "@/features/auth/auth-provider";

/**
 * Trail, theme, sign out — the same row the other two applications render.
 *
 * The ⌘K command palette and the "3 unread" bell that used to live here are gone: the
 * palette listed three labels that navigated nowhere and the badge was a literal 3.
 * They can come back the day they are wired to something. (Chúng vừa được dịch sang tiếng
 * Việt ở nhánh main — bản dịch đó mất theo, vì chính hai control đó bị bỏ.)
 */
export function AdminTopbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { logout, user } = useAdminAuth();
  const pathname = usePathname();

  return (
    <AppTopbar
      actions={
        <>
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
