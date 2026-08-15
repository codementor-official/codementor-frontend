"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code2, LogIn } from "lucide-react";
import { Button } from "@codementor/ui";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { status, error, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/moderation");
  }, [status, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border">
            <Code2 aria-hidden="true" className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">CodeMentor</p>
            <p className="text-xs text-muted-foreground">Bảng quản trị</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold">Đăng nhập</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Đăng nhập, đăng ký và đổi mật khẩu đều do CodeMentor ID xử lý. Trang này không
          nhận mật khẩu của bạn.
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
    </main>
  );
}
