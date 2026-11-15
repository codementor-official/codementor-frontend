"use client";

import { useState } from "react";
import { EyeIcon as Eye, EyeSlashIcon as EyeOff, KeyIcon as Key } from "@phosphor-icons/react/ssr";
import { Button } from "./button";
import { Card, CardContent, CardHeader } from "./card";
import { FieldError, fieldA11y } from "./field";
import { Input } from "./input";
import { useFieldErrors } from "./use-field-errors";

/**
 * Đổi mật khẩu trong Cài đặt của cả ba app, không qua trang Keycloak. `submit` gọi
 * `POST /me/password` qua API client của app; backend kiểm mật khẩu hiện tại và đăng xuất mọi
 * phiên, nên `onChanged` đưa người dùng về trang đăng nhập.
 */
export function ChangePasswordCard({
  submit,
  onChanged,
  forgotHref,
}: {
  submit: (input: { currentPassword: string; newPassword: string }) => Promise<unknown>;
  onChanged: () => void;
  /** Where "Quên mật khẩu?" leads: the client app's `/forgot-password`. */
  forgotHref: string;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useFieldErrors(
    { current, next, confirm },
    {
      current: current ? undefined : "Nhập mật khẩu hiện tại",
      next: !next ? "Nhập mật khẩu mới" : next.length < 8 ? "Mật khẩu tối thiểu 8 ký tự" : next.length > 128 ? "Mật khẩu tối đa 128 ký tự" : next === current ? "Mật khẩu mới phải khác mật khẩu hiện tại" : undefined,
      confirm: !confirm ? "Nhập lại mật khẩu mới" : confirm !== next ? "Mật khẩu xác nhận không khớp" : undefined,
    },
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.validate()) return;
    setPending(true);
    try {
      await submit({ currentPassword: current, newPassword: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      form.reset();
      setDone(true);
      // Every session was just ended on the server; give the message a moment, then sign in again.
      setTimeout(onChanged, 2500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đổi được mật khẩu. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  };

  const field = (id: "current" | "next" | "confirm", label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor={`password-${id}`}>{label}</label>
      <Input
        {...fieldA11y(`password-${id}`, form.errors[id])}
        autoComplete={autoComplete}
        disabled={pending || done}
        id={`password-${id}`}
        onChange={(event) => set(event.target.value)}
        rightSlot={id === "current" ? (
          <button
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShow((v) => !v)}
            type="button"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : undefined}
        type={show ? "text" : "password"}
        value={value}
      />
      <FieldError className="mt-1.5" error={form.errors[id]} htmlFor={`password-${id}`} />
    </div>
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Key aria-hidden="true" className="size-4 text-muted-foreground" /> Đổi mật khẩu</h2>
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm" role="status">
            Đã đổi mật khẩu. Mọi phiên đăng nhập đã được đăng xuất; đang chuyển tới trang đăng nhập…
          </p>
        ) : (
          <form className="grid gap-3" noValidate onSubmit={onSubmit}>
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
            {field("current", "Mật khẩu hiện tại", current, setCurrent, "current-password")}
            {field("next", "Mật khẩu mới", next, setNext, "new-password")}
            {field("confirm", "Nhập lại mật khẩu mới", confirm, setConfirm, "new-password")}
            <p className="text-xs text-muted-foreground">
              Ít nhất 8 ký tự. Sau khi đổi, bạn sẽ được đăng xuất khỏi mọi thiết bị. Chưa có mật khẩu (đăng nhập bằng Google/Facebook) hoặc quên mật khẩu?{" "}
              <a className="font-medium text-primary hover:underline" href={forgotHref}>Đặt lại qua email</a>.
            </p>
            <div>
              <Button disabled={pending} type="submit">{pending ? "Đang đổi…" : "Đổi mật khẩu"}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
