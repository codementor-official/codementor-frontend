"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiClientError } from "@codementor/api-client";
import { Button } from "@codementor/ui";
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

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(profile),
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setSaved(false);
    setFailure(null);
    try {
      const updated = await api.updateProfile(toUpdateInput(values));
      // Reset with the server's answer, not the submitted values: it is the row that
      // was actually stored, and it clears the dirty state in one step.
      reset(toFormValues(updated));
      onSaved(updated);
      setSaved(true);
    } catch (cause) {
      // Uniqueness lives in the database, so a taken handle can only surface here.
      // Attaching it to the field beats a banner the user has to map back themselves.
      if (cause instanceof ApiClientError && cause.status === 409) {
        setError("handle", { message: "Handle này đã có người dùng" });
        return;
      }
      setFailure(cause instanceof Error ? cause.message : "Lưu thất bại");
    }
  };

  return (
    <form className="max-w-xl" noValidate onSubmit={handleSubmit(onSubmit)}>
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

      <Field error={errors.bio?.message} htmlFor="bio" label="Giới thiệu">
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

      <Field error={errors.avatarUrl?.message} htmlFor="avatarUrl" label="Ảnh đại diện (URL)">
        <input
          className={inputClassName}
          id="avatarUrl"
          placeholder="https://"
          {...register("avatarUrl")}
        />
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

      {failure && (
        <p
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {failure}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button disabled={isSubmitting || !isDirty} type="submit">
          {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
        {saved && !isDirty && (
          <span className="text-sm text-muted-foreground" role="status">
            Đã lưu
          </span>
        )}
      </div>
    </form>
  );
}
