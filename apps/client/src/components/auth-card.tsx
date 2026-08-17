"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { resetPasswordUrl } from "@codementor/auth";
import { Input } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { FacebookIcon, GoogleIcon } from "@/components/provider-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { keycloakConfig } from "@/lib/env";
import { useAuth } from "@/providers/auth-provider";

/**
 * Đăng nhập và đăng ký, cả hai đều nằm trên giao diện CodeMentor — không trang nào của
 * Keycloak lộ ra cho người dùng.
 *
 * Keycloak vẫn là nơi duy nhất giữ tài khoản, mật khẩu, vai trò và việc liên kết tài
 * khoản. Form ở đây không tự xác thực gì cả: nó gửi thông tin tới BFF cùng origin
 * (`/api/auth/login`, `/api/auth/register`), nơi mọi việc với Keycloak diễn ra bằng
 * client bí mật `codementor-web-bff`. Trình duyệt không bao giờ thấy client secret,
 * cũng không bao giờ gọi thẳng Keycloak.
 *
 * Google/Facebook đi đường khác hẳn: popup + `kc_idp_hint`, do oidc-client-ts lo.
 */
type Pending = "credentials" | "google" | "facebook" | null;

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const { status, error, signInWithPassword, signUpWithPassword, signInWithPopup } = useAuth();
  const router = useRouter();
  const isSignup = mode === "signup";

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    // `next` do RequireAuth đặt khi nó chặn một trang. Chỉ nhận đường dẫn nội bộ bắt đầu
    // bằng một dấu "/": "//evil.com" là URL tuyệt đối với trình duyệt, nên nếu chỉ kiểm
    // ký tự đầu thì trang đăng nhập trở thành bàn đạp chuyển hướng ra ngoài.
    const next = new URLSearchParams(window.location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/practice";
    router.replace(safe);
  }, [status, router]);

  const busy = pending !== null || status === "loading";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    // Kiểm ngay tại chỗ: gửi lên rồi mới biết hai ô mật khẩu lệch nhau là một vòng
    // request thừa, và tài khoản có thể đã được tạo với mật khẩu người dùng gõ nhầm.
    if (isSignup && password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPending("credentials");
    try {
      if (isSignup) {
        await signUpWithPassword({ displayName, email: username, password });
      } else {
        await signInWithPassword(username, password);
      }
      // Mật khẩu không nằm lại trong state lâu hơn mức cần thiết. Điều hướng do effect
      // ở trên lo, sau khi provider xác nhận phiên.
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Thao tác thất bại.");
    } finally {
      setPending(null);
    }
  };

  const onSocial = async (provider: "google" | "facebook") => {
    setFormError(null);
    setPending(provider);
    try {
      await signInWithPopup(provider);
    } finally {
      setPending(null);
    }
  };

  const message = formError ?? error;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg px-5 py-10">
      {/* Logo đứng ngoài card và là mỏ neo thị giác của cả trang. `priority` vì nó nằm
          trên màn hình đầu tiên — để Next tải lười thì logo nhấp nháy khi vào trang. */}
      <BrandLogo priority size="lg" />

      <Card className="mt-6 w-full max-w-sm p-7">
        <h1 className="text-center text-xl font-bold text-navy">
          {isSignup ? "Tạo tài khoản mới" : "Chào mừng trở lại!"}
        </h1>
        <p className="mt-1.5 mb-6 text-center text-sm leading-relaxed text-text-muted">
          {isSignup
            ? "Đăng ký để bắt đầu lộ trình học của bạn."
            : "Đăng nhập để tiếp tục học tập và luyện tập."}
        </p>

        {message && (
          <p
            className="mb-4 rounded-md border border-danger/40 bg-danger-tint px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {message}
          </p>
        )}

        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          {isSignup && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="displayName">
                Họ và tên
              </label>
              <Input
                autoComplete="name"
                autoFocus
                icon={<UserRound />}
                id="displayName"
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nguyễn Văn A"
                required
                type="text"
                value={displayName}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="username">
              {isSignup ? "Email" : "Email / Tên đăng nhập"}
            </label>
            <Input
              autoComplete={isSignup ? "email" : "username"}
              autoFocus={!isSignup}
              icon={<Mail />}
              id="username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ban@student.iuh.edu.vn"
              required
              type={isSignup ? "email" : "text"}
              value={username}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="password">
              Mật khẩu
            </label>
            <Input
              autoComplete={isSignup ? "new-password" : "current-password"}
              icon={<Lock />}
              id="password"
              minLength={isSignup ? 8 : undefined}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              rightSlot={
                <button
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              type={showPassword ? "text" : "password"}
              value={password}
            />
          </div>

          {isSignup && (
            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-text-muted"
                htmlFor="confirmPassword"
              >
                Xác nhận mật khẩu
              </label>
              <Input
                autoComplete="new-password"
                icon={<Lock />}
                id="confirmPassword"
                name="confirmPassword"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
              />
            </div>
          )}

          {!isSignup && (
            <a
              className="self-end text-xs font-medium text-primary hover:underline"
              href={resetPasswordUrl(keycloakConfig)}
            >
              Quên mật khẩu?
            </a>
          )}

          <Button className={`w-full ${isSignup ? "mt-2" : "mt-1"}`} disabled={busy} type="submit">
            {pending === "credentials" && (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            )}
            {pending === "credentials"
              ? isSignup
                ? "Đang tạo tài khoản…"
                : "Đang đăng nhập…"
              : isSignup
                ? "Đăng ký"
                : "Đăng nhập"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-text-muted">
          <span className="h-px flex-1 bg-border" />
          hoặc
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <SocialButton
            busy={busy}
            icon={<GoogleIcon />}
            label="Tiếp tục với Google"
            loading={pending === "google"}
            onClick={() => void onSocial("google")}
          />
          <SocialButton
            busy={busy}
            icon={<FacebookIcon />}
            label="Tiếp tục với Facebook"
            loading={pending === "facebook"}
            onClick={() => void onSocial("facebook")}
          />
        </div>

        <p className="mt-5 text-center text-xs text-text-muted">
          {isSignup ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <Link className="font-semibold text-primary hover:underline" href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Đăng nhập" : "Đăng ký"}
          </Link>
        </p>
      </Card>
    </div>
  );
}

/**
 * Icon neo trái, nhãn căn giữa: hai nút vì thế cao bằng nhau và icon thẳng cột, kể cả
 * khi nhãn dài ngắn khác nhau. Lúc đang chờ popup, spinner thế chỗ icon để nút không
 * đổi kích thước.
 */
function SocialButton({
  busy,
  icon,
  label,
  loading,
  onClick,
}: {
  busy: boolean;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button className="relative w-full" disabled={busy} onClick={onClick} variant="outline">
      <span className="absolute top-1/2 left-4 flex -translate-y-1/2 items-center">
        {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : icon}
      </span>
      {label}
    </Button>
  );
}
