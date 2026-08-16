"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

/**
 * Đăng nhập và đăng ký đều do CodeMentor ID (Keycloak) xử lý.
 *
 * Trước đây đây là một form email/mật khẩu tự dựng, nhưng nó không gửi đi đâu cả — bấm
 * "Đăng nhập" là `router.push("/dashboard")`. Một form nhận mật khẩu rồi không làm gì với nó
 * còn tệ hơn không có form: nó dạy người dùng gõ mật khẩu thật vào chỗ không xác thực.
 */
export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const { status, error, signIn, signInWithPopup, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/practice");
  }, [status, router]);

  const isSignup = mode === "signup";

  return (
    <div className="flex flex-1 items-center justify-center bg-bg p-5">
      <Card className="w-full max-w-sm p-7">
        <h1 className="mb-2 text-center text-xl font-bold text-navy">
          {isSignup ? "Tạo tài khoản mới" : "Chào mừng trở lại!"}
        </h1>
        <p className="mb-6 text-center text-sm leading-relaxed text-text-muted">
          Đăng nhập, đăng ký và đổi mật khẩu đều do CodeMentor ID xử lý. Trang này không nhận
          mật khẩu của bạn.
        </p>

        {error && (
          <p
            className="mb-4 rounded-md border border-danger/40 bg-danger-tint px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={status === "loading"}
          onClick={isSignup ? signUp : signIn}
        >
          <LogIn className="h-4 w-4" />
          {status === "loading" ? "Đang kiểm tra phiên…" : isSignup ? "Đăng ký" : "Đăng nhập"}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          hoặc
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={status === "loading"}
            onClick={() => void signInWithPopup("google")}
            variant="outline"
          >
            Tiếp tục với Google
          </Button>
          <Button
            className="w-full"
            disabled={status === "loading"}
            onClick={() => void signInWithPopup("facebook")}
            variant="outline"
          >
            Tiếp tục với Facebook
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          {isSignup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <button
            className="font-semibold text-primary"
            onClick={isSignup ? signIn : signUp}
            type="button"
          >
            {isSignup ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
      </Card>
    </div>
  );
}
