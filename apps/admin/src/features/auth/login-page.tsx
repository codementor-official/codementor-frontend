"use client";

import { hasRole } from "@codementor/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAdminAuth } from "./auth-provider";

export function LoginPage() {
  const router = useRouter();
  const { authenticated, initialized, login, user } = useAdminAuth();
  const loginStarted = useRef(false);

  useEffect(() => {
    if (!initialized) return;

    if (authenticated) {
      router.replace(hasRole(user, "admin") ? "/dashboard" : "/unauthorized");
      return;
    }

    if (loginStarted.current) return;
    loginStarted.current = true;
    void login();
  }, [authenticated, initialized, login, router, user]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--foreground) 8%, transparent), transparent 32rem), radial-gradient(circle at 15% 90%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 34rem)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <BrandLogo size={56} />
        <p className="mt-4 text-sm font-semibold">CodeMentor</p>
        <p className="text-xs text-muted-foreground">Bảng điều khiển quản trị</p>

        <div className="mt-6 w-full rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Đang chuyển đến CodeMentor ID…
          </div>
        </div>
      </div>
    </main>
  );
}
