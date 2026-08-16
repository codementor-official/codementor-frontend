"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { status, error, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 32rem), radial-gradient(circle at 85% 85%, color-mix(in srgb, var(--foreground) 6%, transparent), transparent 34rem)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <BrandLogo size={56} />
        <p className="mt-4 text-sm font-semibold">CodeMentor</p>
        <p className="text-xs text-muted-foreground">Trang giảng viên</p>

        <div className="mt-6 w-full rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold">Đăng nhập</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Đăng nhập và đổi mật khẩu đều do CodeMentor ID xử lý. Trang này không nhận mật
            khẩu của bạn.
          </p>

          {error && (
            <p
              className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            className="mt-6 w-full"
            disabled={status === "loading"}
            onClick={signIn}
            type="button"
          >
            <LogIn aria-hidden="true" className="size-4" />
            {status === "loading" ? "Đang kiểm tra phiên…" : "Tiếp tục với CodeMentor ID"}
          </Button>
        </div>
      </div>
    </main>
  );
}
