"use client";

import { hasRole } from "@codementor/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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
    <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      Redirecting to Keycloak…
    </main>
  );
}
