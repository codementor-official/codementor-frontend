"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppTopbar, Breadcrumb, ThemeMenu } from "@codementor/ui";
import { breadcrumbFor } from "@/components/navigation/route-meta";
import { useAuth } from "@/providers/auth-provider";

/**
 * Trail, theme, sign out. No search box and no notification bell: neither has anything
 * behind it, and a control that never does anything teaches people to ignore the whole bar.
 *
 * The collapse toggle moved to the sidebar footer, where the thing it collapses is.
 */
export function LecturerTopbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <AppTopbar
      actions={
        <>
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
      breadcrumb={<Breadcrumb items={breadcrumbFor(pathname)} />}
      onMobileMenu={onMobileMenu}
    />
  );
}
