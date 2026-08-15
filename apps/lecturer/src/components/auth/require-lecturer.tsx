"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { hasAnyRole } from "@codementor/auth";
import { Button } from "@codementor/ui";
import { useAuth } from "@/providers/auth-provider";

/**
 * A convenience, not a security boundary. The gate that matters is the backend:
 * every service verifies the Keycloak signature and enforces its own authorisation.
 * This only spares a lecturer from a console full of empty lists and 403s.
 */
export function RequireLecturer({ children }: Readonly<{ children: React.ReactNode }>) {
  const { status, user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </main>
    );
  }

  if (!hasAnyRole(user, ["lecturer", "admin"])) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <ShieldAlert aria-hidden="true" className="size-6 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Tài khoản chưa được cấp quyền giảng viên</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tài khoản <span className="font-medium text-foreground">{user?.email}</span> đang ở
            vai trò <span className="font-medium text-foreground">{user?.role}</span>. Liên hệ
            quản trị viên để được cấp quyền giảng viên.
          </p>
          <Button className="mt-5" onClick={signOut} type="button" variant="outline">
            Đăng xuất
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
