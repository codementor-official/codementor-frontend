"use client";

import { useEffect, useState } from "react";
import { UserIcon as User } from "@phosphor-icons/react/ssr";
import { ProfileForm } from "@/features/profile/profile-form";
import type { UserProfile } from "@/features/profile/types";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { ChangePasswordCard, PageHeader } from "@codementor/ui";
import { PageBody } from "@/components/page/page-body";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default function ProfilePage() {
  const { refreshUser, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The provider holds only what the shell renders. The form needs every editable
    // field, so it reads the full record rather than widening the session object.
    api
      .me()
      .then(setProfile)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ"),
      );
  }, []);

  return (
    <PageBody>
      <PageHeader
        description="Email, mật khẩu và đăng nhập do CodeMentor ID quản lý."
        icon={User}
        title="Hồ sơ"
      />

      {error && (
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {!profile && !error && <p className="text-sm text-muted-foreground">Đang tải…</p>}

      {profile && (
        // Two panels across the row. The form used to be a single 576px column pinned to
        // the left of a full-width page, which read as a rendering fault rather than a
        // choice; the account note that trailed below it fills the other half.
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
            <ProfileForm
              onSaved={(updated) => {
                setProfile(updated);
                // The sidebar shows the display name; without this it keeps the old one
                // until the next full page load.
                void refreshUser();
              }}
              profile={profile}
            />
          </section>

          <div className="flex flex-col gap-4">
          <aside className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Tài khoản</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="min-w-0 truncate font-medium" title={profile.email}>{profile.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Xác thực email</dt>
                <dd className={profile.emailVerified ? "font-medium text-success" : "font-medium text-warning"}>
                  {profile.emailVerified ? "Đã xác thực" : "Chưa xác thực"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Vai trò</dt>
                <dd className="font-medium">{profile.role === "admin" ? "Quản trị viên" : "Giảng viên"}</dd>
              </div>
            </dl>
          </aside>
          <ChangePasswordCard
            forgotHref={`${CLIENT_URL}/forgot-password`}
            onChanged={signOut}
            submit={(body) => api.changePassword(body)}
          />
          </div>
        </div>
      )}
    </PageBody>
  );
}
