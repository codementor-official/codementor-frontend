"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClientError } from "@codementor/api-client";
import { Button, useToast } from "@codementor/ui";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { api } from "@/lib/api";
import {
  LOCALES,
  TIMEZONES,
  profileFormSchema,
  toFormValues,
  toUpdateInput,
  type ProfileFormValues,
  type UserProfile,
} from "@/features/profile/types";

const LOCALE_LABELS: Record<(typeof LOCALES)[number], string> = {
  vi: "Tiếng Việt",
  en: "English",
};

interface ProfileFormProps {
  profile: UserProfile;
  onSaved: (profile: UserProfile) => void;
}

/** Bản sao `IMAGE_CONTENT_TYPES` và trần `IMAGE_MAX_UPLOAD_MB` mặc định của backend. */
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function avatarFileError(file: Pick<File, "type" | "size">): string | null {
  if (!AVATAR_TYPES.includes(file.type)) return "Chỉ nhận ảnh PNG, JPEG hoặc WebP";
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh tối đa 5 MB";
  return null;
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const toast = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(profile),
  });
  const bio = useWatch({ control, name: "bio" }) ?? "";
  const avatarUrl = useWatch({ control, name: "avatarUrl" }) ?? "";
  const shownAvatar = avatarPreview ?? (avatarUrl && !errors.avatarUrl ? avatarUrl : null);

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    const problem = avatarFileError(file);
    setAvatarError(problem);
    if (problem) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const input = toUpdateInput(values);
      if (avatarFile) {
        // Ảnh lên S3 trước; chỉ lưu URL vào hồ sơ khi tải lên thành công.
        const target = await api.avatarUploadUrl({
          filename: avatarFile.name,
          contentType: avatarFile.type,
          sizeBytes: avatarFile.size,
        });
        const upload = await fetch(target.uploadUrl, { method: "PUT", headers: target.headers, body: avatarFile });
        if (!upload.ok) throw new Error("Không tải được ảnh lên. Vui lòng thử lại.");
        input.avatarUrl = target.publicUrl;
      }
      const updated = await api.updateProfile(input);
      // Reset with the server's answer, not the submitted values: it is the row that
      // was actually stored, and it clears the dirty state in one step.
      reset(toFormValues(updated));
      setAvatarFile(null);
      setAvatarPreview(null);
      onSaved(updated);
      toast.success("Đã lưu hồ sơ");
    } catch (cause) {
      // Uniqueness lives in the database, so a taken handle can only surface here.
      // Attaching it to the field beats a banner the user has to map back themselves.
      if (cause instanceof ApiClientError && cause.status === 409) {
        setError("handle", { message: "Handle này đã có người dùng" });
        return;
      }
      toast.error(cause instanceof Error ? cause.message : "Lưu thất bại");
    }
  };

  return (
    <form className="grid gap-x-5 gap-y-5 sm:grid-cols-2" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Field error={errors.displayName?.message} htmlFor="displayName" label="Tên hiển thị">
        <input className={inputClassName} id="displayName" {...register("displayName")} />
      </Field>

      <Field
        error={errors.handle?.message}
        hint="Xuất hiện trong địa chỉ hồ sơ công khai. Để trống nếu chưa cần."
        htmlFor="handle"
        label="Handle"
      >
        <input className={inputClassName} id="handle" placeholder="giasi" {...register("handle")} />
      </Field>

      <Field counter={{ value: bio, max: 2000 }} error={errors.bio?.message} htmlFor="bio" label="Giới thiệu" wide>
        <textarea className={textareaClassName} id="bio" {...register("bio")} />
      </Field>

      <Field error={errors.websiteUrl?.message} htmlFor="websiteUrl" label="Website">
        <input
          className={inputClassName}
          id="websiteUrl"
          placeholder="https://"
          {...register("websiteUrl")}
        />
      </Field>

      <Field
        error={avatarError ?? errors.avatarUrl?.message}
        description="Tải ảnh PNG/JPEG/WebP tối đa 5 MB, hoặc dán đường dẫn ảnh."
        htmlFor="avatarUrl"
        label="Ảnh đại diện"
      >
        <div className="flex items-center gap-3">
          {shownAvatar ? (
            <div
              role="img"
              aria-label="Xem trước ảnh đại diện"
              className="size-12 shrink-0 rounded-full border border-border bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(shownAvatar)})` }}
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <input
              className={inputClassName}
              disabled={avatarFile !== null}
              id="avatarUrl"
              placeholder="https://"
              {...register("avatarUrl")}
            />
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
                Chọn ảnh từ máy
                <input
                  accept={AVATAR_TYPES.join(",")}
                  className="sr-only"
                  type="file"
                  onChange={(event) => {
                    pickAvatar(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              {avatarFile && (
                <button
                  className="text-xs text-muted-foreground underline underline-offset-4"
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Bỏ ảnh đã chọn
                </button>
              )}
            </div>
          </div>
        </div>
      </Field>

      <Field error={errors.githubHandle?.message} htmlFor="githubHandle" label="GitHub">
        <input className={inputClassName} id="githubHandle" {...register("githubHandle")} />
      </Field>

      <Field htmlFor="locale" label="Ngôn ngữ">
        <select className={inputClassName} id="locale" {...register("locale")}>
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </option>
          ))}
        </select>
      </Field>

      <Field htmlFor="timezone" label="Múi giờ">
        <select className={inputClassName} id="timezone" {...register("timezone")}>
          {TIMEZONES.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={isSubmitting || (!isDirty && !avatarFile)} type="submit">
          {isSubmitting ? (avatarFile ? "Đang tải ảnh…" : "Đang lưu…") : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}
