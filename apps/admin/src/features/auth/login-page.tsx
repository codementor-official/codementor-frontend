"use client";

import { hasRole } from "@codementor/auth";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "./auth-provider";

export function LoginPage() {
  const router = useRouter();
  const { authenticated, initialized, login, user } = useAdminAuth();

  useEffect(() => {
    if (!initialized || !authenticated) return;
    router.replace(hasRole(user, "ADMIN") ? "/dashboard" : "/unauthorized");
  }, [authenticated, initialized, router, user]);

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck aria-hidden="true" className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">CodeMentor Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in through Keycloak. Only accounts with the ADMIN realm role can continue.
        </p>
        <Button
          className="mt-6 w-full"
          disabled={!initialized}
          onClick={() => void login()}
          type="button"
        >
          {initialized ? "Sign in with Keycloak" : "Preparing secure sign-in…"}
        </Button>
      </section>
    </main>
  );
}
