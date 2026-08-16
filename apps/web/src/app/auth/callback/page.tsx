"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserManager } from "@codementor/auth";
import { keycloakConfig } from "@/lib/env";

/**
 * Where Keycloak sends the browser back with the authorization code. Redeeming the
 * code stores the tokens, which fires `userLoaded` on the shared UserManager and
 * lets the auth provider pick the session up.
 */
export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // React runs effects twice in development. Redeeming an authorization code twice
  // fails by design — it is single use — so the second run must not attempt it.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const manager = getUserManager(keycloakConfig, window.location.origin);
    if (window.opener && window.opener !== window) {
      void manager.signinPopupCallback().catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại");
      });
      return;
    }

    manager
      .signinRedirectCallback()
      .then(() => router.replace("/practice"))
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại");
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      {error ? (
        <div className="w-full max-w-sm">
          <h1 className="text-lg font-semibold">Đăng nhập thất bại</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
          <Link className="mt-4 inline-block text-sm underline underline-offset-4" href="/login">
            Thử lại
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Đang hoàn tất đăng nhập…</p>
      )}
    </main>
  );
}
