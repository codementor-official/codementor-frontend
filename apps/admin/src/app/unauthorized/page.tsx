"use client";

import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/features/auth/auth-provider";

export default function Page() {
  const { logout } = useAdminAuth();
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-destructive">403 · Forbidden</p>
        <h1 className="mt-2 text-2xl font-semibold">Administrator access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your Keycloak account is valid but does not have the ADMIN realm role.
        </p>
        <Button className="mt-6" onClick={() => void logout()} type="button">
          Sign out
        </Button>
      </section>
    </main>
  );
}
