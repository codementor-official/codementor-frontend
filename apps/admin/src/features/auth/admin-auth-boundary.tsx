"use client";

import { hasRole } from "@codementor/auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAdminAuth } from "./auth-provider";

export function AdminAuthBoundary({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { authenticated, initialized, user } = useAdminAuth();
  const isAdmin = hasRole(user, "ADMIN");

  useEffect(() => {
    if (!initialized) return;
    if (!authenticated) router.replace("/login");
    else if (!isAdmin) router.replace("/unauthorized");
  }, [authenticated, initialized, isAdmin, router]);

  if (!initialized || !authenticated || !isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Checking administrator access…
      </main>
    );
  }

  return children;
}
