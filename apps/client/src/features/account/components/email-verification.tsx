"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MailWarning, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { useToast } from "@codementor/ui";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EmailVerificationStatus } from "../types";

function verificationError(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string; error?: { message?: string } } | undefined;
    return body?.message ?? body?.error?.message ?? "Không kết nối được dịch vụ xác thực email. Vui lòng thử lại.";
  }
  return "Không kết nối được dịch vụ xác thực email. Vui lòng thử lại.";
}

export function EmailVerificationBanner() {
  const { user, status } = useAuth();
  const pathname = usePathname();
  if (status !== "authenticated" || user?.emailVerified !== false || pathname === "/profile") return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-primary/25 bg-primary-tint px-6 py-2.5 text-xs text-navy">
      <MailWarning className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>Email chưa xác thực. Bạn chưa thể nhận email nhắc học và thông báo.</span>
      <Link href="/profile?tab=settings#email-verification" className="font-semibold text-primary underline underline-offset-4">Xác thực email</Link>
    </div>
  );
}

export function EmailVerificationCard() {
  const { user } = useAuth();
  return user ? <VerificationPanel key={user.id} /> : null;
}

function VerificationPanel() {
  const { user, refreshUser } = useAuth();
  const localVerified = user?.emailVerified;
  const toast = useToast();
  const [verification, setVerification] = useState<EmailVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const active = useRef(false);
  const lastCheck = useRef(0);

  const check = useCallback(() => {
    lastCheck.current = Date.now();
    return api.account.emailVerification().then(async (result) => {
      if (!active.current) return;
      setError(null);
      setVerification(result);
      setRetryIn(result.retryAfterSeconds);
      if (result.verified !== localVerified) await refreshUser();
    }).catch((cause: unknown) => {
      if (active.current) setError(verificationError(cause));
    }).finally(() => {
      if (active.current) setLoading(false);
    });
  }, [refreshUser, localVerified]);

  useEffect(() => {
    active.current = true;
    void check();
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > 10_000) {
        setLoading(true);
        void check();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active.current = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [check]);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setTimeout(() => setRetryIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [retryIn]);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const result = await api.account.sendVerificationEmail();
      if (!active.current) return;
      setVerification(result);
      setRetryIn(result.retryAfterSeconds);
      if (result.verified) {
        await refreshUser();
        toast.success("Email của bạn đã được xác thực.");
      } else if (result.sent) {
        setSent(true);
        toast.success("Đã gửi email xác thực. Hãy kiểm tra hộp thư và mục Spam.");
      }
    } catch (cause) {
      if (!active.current) return;
      setRetryIn(60);
      toast.error(verificationError(cause));
    } finally {
      if (active.current) setSending(false);
    }
  }

  const verified = verification?.verified ?? user?.emailVerified === true;
  const Icon = verified ? ShieldCheck : MailWarning;
  return (
    <Card id="email-verification" className="mb-5 scroll-mt-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span className="rounded-lg bg-primary-tint p-2 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-navy">Xác thực email</h2>
            <span className={`rounded-md px-2 py-1 text-2xs font-semibold ${verified ? "bg-border-soft text-navy" : "bg-primary-tint text-primary"}`}>{verified ? "Đã xác thực" : "Chưa xác thực"}</span>
          </div>
          <p className="mt-1 break-all text-sm text-text-muted">{verification?.email ?? user?.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">{verified ? "Email đã được xác thực. Bạn có thể nhận email theo các tùy chọn thông báo bên dưới." : "Xác thực email để nhận nhắc học và thông báo qua email. Bạn vẫn có thể học và nhận thông báo trong hệ thống."}</p>
          {sent && !verified && <p role="status" className="mt-2 text-xs text-text-muted">Đang chờ xác thực: mở liên kết trong email (có hiệu lực 30 phút), sau đó quay lại đây kiểm tra trạng thái.</p>}
          {verification && !verified && !verification.canSend && <p className="mt-2 text-xs font-medium text-primary">Dịch vụ gửi email xác thực chưa được cấu hình. Vui lòng liên hệ quản trị viên để bật tính năng này.</p>}
          {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!verified && <Button size="sm" disabled={loading || sending || !verification?.canSend || retryIn > 0} onClick={() => void send()}><Send className="h-3.5 w-3.5" />{sending ? "Đang gửi…" : retryIn > 0 ? `Gửi lại sau ${retryIn}s` : sent ? "Gửi lại email" : "Gửi email xác thực"}</Button>}
          <Button size="sm" variant="outline" disabled={loading || sending} onClick={() => { setLoading(true); void check(); }}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />{loading ? "Đang kiểm tra…" : verified ? "Kiểm tra lại" : "Tôi đã xác thực"}</Button>
        </div>
      </div>
    </Card>
  );
}
