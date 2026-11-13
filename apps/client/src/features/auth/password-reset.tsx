"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon as CheckCircle, CircleNotchIcon as Loader2, EnvelopeIcon as Mail, EyeIcon as Eye, EyeSlashIcon as EyeOff, LockIcon as Lock, WarningCircleIcon as Warning } from "@phosphor-icons/react/ssr";
import { FieldError, fieldA11y, Input, useFieldErrors } from "@codementor/ui";
import { email as emailRule } from "@codementor/utils";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiBaseUrl } from "@/lib/env";

/**
 * Quên / đặt lại mật khẩu trên giao diện CodeMentor (core-service `system/password-reset`).
 * Công khai: người dùng ở đây chưa đăng nhập được. Backend luôn trả lời giống nhau dù email
 * có tài khoản hay không, nên trang cũng vậy.
 */
async function post<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${apiBaseUrl.replace(/\/+$/, "")}/system/password-reset${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as { data?: T; message?: string; details?: { code?: string } } | null;
  if (!response.ok) {
    throw Object.assign(new Error(json?.message || "Không kết nối được máy chủ. Vui lòng thử lại."), { code: json?.details?.code });
  }
  return (json?.data ?? json) as T;
}

function Shell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg px-5 py-10">
      <BrandLogo priority size="lg" />
      <Card className="mt-6 w-full max-w-sm p-7">
        <h1 className="text-center text-xl font-bold text-navy">{title}</h1>
        <p className="mt-1.5 mb-6 text-center text-sm leading-relaxed text-text-muted">{lead}</p>
        {children}
      </Card>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-md border border-danger/40 bg-danger-tint px-3 py-2 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

const RESEND_SECONDS = 60;

export function ForgotPasswordCard({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const form = useFieldErrors({ email }, { email: emailRule(email.trim()) });

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);
    if (!form.validate()) return;
    setPending(true);
    try {
      await post("/request", { email: email.trim() });
      setSentTo(email.trim());
      setWait(RESEND_SECONDS);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <Shell title="Kiểm tra hộp thư của bạn" lead="Liên kết đặt lại mật khẩu dùng được một lần và hết hạn sau 30 phút.">
        {error && <Alert>{error}</Alert>}
        <div className="flex items-start gap-3 rounded-md border border-border bg-bg px-3 py-3 text-sm text-text">
          <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Nếu <strong className="break-all">{sentTo}</strong> có tài khoản CodeMentor, chúng tôi vừa gửi liên kết đặt lại mật khẩu tới địa chỉ này.
            Không thấy email? Hãy xem thư mục Spam hoặc Quảng cáo.
          </p>
        </div>
        <Button className="mt-4 w-full" disabled={pending || wait > 0} onClick={() => void send()} variant="outline">
          {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {wait > 0 ? `Gửi lại sau ${wait} giây` : "Gửi lại email"}
        </Button>
        <button className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline" onClick={() => { setSentTo(null); setError(null); }} type="button">
          Dùng email khác
        </button>
        <p className="mt-5 text-center text-xs text-text-muted">
          Đã nhớ mật khẩu? <Link className="font-semibold text-primary hover:underline" href="/login">Đăng nhập</Link>
        </p>
      </Shell>
    );
  }

  return (
    <Shell title="Quên mật khẩu?" lead="Nhập email bạn dùng để đăng nhập. Chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu mới.">
      {error && <Alert>{error}</Alert>}
      <form className="flex flex-col gap-3" noValidate onSubmit={send}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="email">Email</label>
          <Input
            {...fieldA11y("email", form.errors.email)}
            autoComplete="email"
            autoFocus
            icon={<Mail />}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="codementor@gmail.com"
            type="email"
            value={email}
          />
          <FieldError className="mt-1.5" error={form.errors.email} htmlFor="email" />
        </div>
        <Button className="mt-1 w-full" disabled={pending} type="submit">
          {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-text-muted">
        Đã nhớ mật khẩu? <Link className="font-semibold text-primary hover:underline" href="/login">Đăng nhập</Link>
      </p>
    </Shell>
  );
}

type LinkState = { kind: "checking" } | { kind: "invalid" } | { kind: "ready"; email: string } | { kind: "done" };

export function ResetPasswordCard({ token }: { token: string }) {
  const [state, setState] = useState<LinkState>(token ? { kind: "checking" } : { kind: "invalid" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useFieldErrors(
    { password, confirm },
    {
      password: !password ? "Nhập mật khẩu mới" : password.length < 8 ? "Mật khẩu tối thiểu 8 ký tự" : password.length > 128 ? "Mật khẩu tối đa 128 ký tự" : undefined,
      confirm: !confirm ? "Nhập lại mật khẩu mới" : confirm !== password ? "Mật khẩu xác nhận không khớp" : undefined,
    },
  );

  useEffect(() => {
    if (!token) return;
    // Keep the live token out of the address bar, history and screenshots once it is read.
    window.history.replaceState(null, "", "/reset-password");
    post<{ valid: boolean; email: string | null }>("/check", { token })
      .then((r) => setState(r.valid ? { kind: "ready", email: r.email ?? "" } : { kind: "invalid" }))
      .catch((cause) => {
        setState({ kind: "ready", email: "" });
        setError((cause as Error).message);
      });
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.validate()) return;
    setPending(true);
    try {
      await post("", { token, password });
      setPassword("");
      setConfirm("");
      form.reset();
      setState({ kind: "done" });
    } catch (cause) {
      if ((cause as { code?: string }).code === "PASSWORD_RESET_LINK_INVALID") setState({ kind: "invalid" });
      else setError((cause as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (state.kind === "checking") {
    return (
      <Shell title="Đặt mật khẩu mới" lead="Đang kiểm tra liên kết…">
        <div className="flex justify-center py-4" aria-busy="true">
          <Loader2 aria-label="Đang kiểm tra" className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (state.kind === "invalid") {
    return (
      <Shell title="Liên kết không còn dùng được" lead="Liên kết đặt lại mật khẩu chỉ dùng được một lần và hết hạn sau 30 phút.">
        <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-bg px-3 py-3 text-sm text-text">
          <Warning aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p>Có thể liên kết đã được dùng, đã hết hạn, hoặc mật khẩu đã được đổi sau khi email được gửi. Hãy yêu cầu một liên kết mới.</p>
        </div>
        <Button className="mt-4 w-full" href="/forgot-password">Gửi liên kết mới</Button>
        <p className="mt-5 text-center text-xs text-text-muted">
          <Link className="font-semibold text-primary hover:underline" href="/login">Về trang đăng nhập</Link>
        </p>
      </Shell>
    );
  }

  if (state.kind === "done") {
    return (
      <Shell title="Đã đặt mật khẩu mới" lead="Mọi phiên đăng nhập cũ đã được đăng xuất để bảo vệ tài khoản.">
        <div className="flex items-start gap-3 rounded-md border border-success/40 bg-bg px-3 py-3 text-sm text-text">
          <CheckCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p>Bạn có thể đăng nhập ngay bằng mật khẩu vừa đặt.</p>
        </div>
        <Button className="mt-4 w-full" href="/login">Đăng nhập</Button>
      </Shell>
    );
  }

  return (
    <Shell
      title="Đặt mật khẩu mới"
      lead={state.email ? `Cho tài khoản ${state.email}. Dùng ít nhất 8 ký tự và khác mật khẩu cũ.` : "Dùng ít nhất 8 ký tự và khác mật khẩu cũ."}
    >
      {error && <Alert>{error}</Alert>}
      <form className="flex flex-col gap-3" noValidate onSubmit={submit}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="password">Mật khẩu mới</label>
          <Input
            {...fieldA11y("password", form.errors.password)}
            autoComplete="new-password"
            autoFocus
            icon={<Lock />}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            rightSlot={
              <button
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="rounded-sm focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
                onClick={() => setShow((visible) => !visible)}
                type="button"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            type={show ? "text" : "password"}
            value={password}
          />
          <FieldError className="mt-1.5" error={form.errors.password} htmlFor="password" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted" htmlFor="confirm">Nhập lại mật khẩu mới</label>
          <Input
            {...fieldA11y("confirm", form.errors.confirm)}
            autoComplete="new-password"
            icon={<Lock />}
            name="confirm"
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="••••••••"
            type={show ? "text" : "password"}
            value={confirm}
          />
          <FieldError className="mt-1.5" error={form.errors.confirm} htmlFor="confirm" />
        </div>
        <Button className="mt-1 w-full" disabled={pending} type="submit">
          {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {pending ? "Đang lưu…" : "Đặt mật khẩu mới"}
        </Button>
      </form>
    </Shell>
  );
}
