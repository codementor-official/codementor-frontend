"use client";

import { useState } from "react";
import { ApiClientError } from "@codementor/api-client";
import { Button, Modal } from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import { usersApi, type KeycloakRole } from "@/lib/api";

const ROLE_OPTIONS: { value: KeycloakRole; label: string }[] = [
  { value: "STUDENT", label: "Học viên" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "ADMIN", label: "Quản trị" },
];

/** Keycloak từ chối mật khẩu ngắn hơn mức này (`@MinLength(12)` ở CreateUserDto). */
const MIN_PASSWORD = 12;

/**
 * Tạo tài khoản trong Keycloak.
 *
 * Tài khoản sinh ra ở Keycloak trước; hàng trong bảng `users` chỉ xuất hiện sau lần đăng
 * nhập đầu tiên (just-in-time provisioning). Nên bấm Tạo xong mà danh sách này chưa có
 * người đó là ĐÚNG, không phải lỗi đồng bộ — màn hình phải nói ra điều đó, nếu không
 * người dùng sẽ bấm tạo lại và nhận lỗi trùng email.
 */
export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const request = useAdminApi();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<KeycloakRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setDisplayName("");
    setRole("STUDENT");
    setPassword("");
    setError(null);
    setCreated(null);
  };

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const canSubmit =
    email.trim().length > 0 && displayName.trim().length > 0 && !passwordTooShort && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await usersApi.create(request, {
        email: email.trim(),
        displayName: displayName.trim(),
        role,
        // Bỏ trống thì Keycloak tự sinh và người dùng đặt lại qua email — đừng gửi chuỗi
        // rỗng, `@MinLength(12)` sẽ từ chối nó.
        temporaryPassword: password.trim() || undefined,
      });
      setCreated(email.trim());
      onCreated();
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={() => {
        reset();
        onClose();
      }}
      open={open}
      title="Tài khoản mới"
    >
      {created !== null ? (
        <div className="grid gap-4">
          <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm">
            Đã tạo <strong>{created}</strong> trong Keycloak.
          </p>
          <p className="text-sm text-muted-foreground">
            Tài khoản chưa xuất hiện trong danh sách bên dưới, và đó là bình thường: hồ sơ
            CodeMentor chỉ được tạo ở lần đăng nhập đầu tiên của người này.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={reset} type="button" variant="outline">
              Tạo tài khoản khác
            </Button>
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {error !== null && (
            <p
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <Field htmlFor="new-user-email" label="Email">
            <input
              autoComplete="off"
              className={inputClass}
              id="new-user-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="giangvien@codementor.dev"
              type="email"
              value={email}
            />
          </Field>

          <Field htmlFor="new-user-name" label="Họ và tên">
            <input
              className={inputClass}
              id="new-user-name"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Nguyễn Văn A"
              value={displayName}
            />
          </Field>

          <Field htmlFor="new-user-role" label="Vai trò">
            <select
              className={inputClass}
              id="new-user-role"
              onChange={(event) => setRole(event.target.value as KeycloakRole)}
              value={role}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            hint={`Bỏ trống để Keycloak tự sinh và gửi liên kết đặt lại. Tối thiểu ${MIN_PASSWORD} ký tự.`}
            htmlFor="new-user-password"
            label="Mật khẩu tạm"
          >
            <input
              autoComplete="new-password"
              className={inputClass}
              id="new-user-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            {passwordTooShort && (
              <p className="mt-1 text-xs text-destructive">
                Còn thiếu {MIN_PASSWORD - password.length} ký tự.
              </p>
            )}
          </Field>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
              variant="ghost"
            >
              Huỷ
            </Button>
            <Button disabled={!canSubmit} onClick={() => void submit()} type="button">
              Tạo tài khoản
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring";

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    // 409 từ Keycloak nghĩa là email đã tồn tại — câu mặc định không nói ra điều đó.
    if (cause.status === 409) return "Email này đã có tài khoản trong Keycloak.";
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Không tạo được tài khoản";
}
