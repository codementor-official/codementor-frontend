"use client";

import { useEffect, useState } from "react";
import { accountConsoleUrl } from "@codementor/auth";
import { ProfileForm } from "@/features/profile/profile-form";
import type { UserProfile } from "@/features/profile/types";
import { api } from "@/lib/api";
import { keycloakConfig } from "@/lib/env";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@codementor/ui";

export default function ProfilePage() {
  const { refreshUser } = useAuth();
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
    <>
      <PageHeader
        description="Email, mật khẩu và đăng nhập do CodeMentor ID quản lý."
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
        <>
          <ProfileForm
            onSaved={(updated) => {
              setProfile(updated);
              // The sidebar shows the display name; without this it keeps the old one
              // until the next full page load.
              void refreshUser();
            }}
            profile={profile}
          />

          <p className="mt-8 max-w-xl border-t pt-5 text-sm text-muted-foreground">
            Đổi email, mật khẩu hoặc bật xác thực hai bước tại{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href={accountConsoleUrl(keycloakConfig)}
              rel="noreferrer"
              target="_blank"
            >
              trang tài khoản CodeMentor ID
            </a>
            .
          </p>
        </>
      )}
    </>
  );
}
