import { z } from "zod";
import type { User } from "@codementor/types";
import { githubHandle, handle, url } from "@codementor/utils";

/** What GET /api/v1/me returns. Extends the shared User with the editable fields. */
export interface UserProfile extends User {
  handle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  githubHandle: string | null;
  locale: string;
  timezone: string;
  emailVerified: boolean;
}

export const LOCALES = ["vi", "en"] as const;
export const TIMEZONES = ["Asia/Ho_Chi_Minh", "Asia/Bangkok", "UTC"] as const;

/**
 * Mirrors the rules core-service enforces, so a mistake is caught before a round
 * trip. The backend still validates: this is a convenience, not the boundary.
 * `handle` cannot be checked here at all — uniqueness lives in the database, and a
 * conflict comes back as 409.
 */
export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, "Không được để trống").max(120, "Tối đa 120 ký tự"),
  // Handle/GitHub/URL dùng chung luật với hồ sơ bên Client (`@codementor/utils`), vì cả hai
  // cùng gọi `PATCH /me`. Handle được hạ chữ thường như `Handle.create` ở backend.
  handle: z.string().trim().superRefine(refineWith(handle)),
  bio: z.string().trim().max(2000, "Tối đa 2000 ký tự"),
  websiteUrl: z.string().trim().superRefine(refineWith((value) => url(value, "Website"))),
  avatarUrl: z.string().trim().superRefine(refineWith((value) => url(value, "Ảnh đại diện"))),
  githubHandle: z.string().trim().superRefine(refineWith(githubHandle)),
  locale: z.enum(LOCALES),
  timezone: z.enum(TIMEZONES),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** The PATCH body. Absent keeps a value, null clears it — matching PATCH semantics. */
export interface UpdateProfileInput {
  displayName?: string;
  handle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  githubHandle?: string | null;
  locale?: string;
  timezone?: string;
}

/** Dùng một luật của `@codementor/utils` (trả câu lỗi hoặc `undefined`) trong zod. */
function refineWith(rule: (value: string) => string | undefined) {
  return (value: string, context: z.RefinementCtx) => {
    const message = rule(value);
    if (message) context.addIssue({ code: "custom", message });
  };
}

export function toFormValues(profile: UserProfile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    // The form works in strings; the API works in null. An empty input is "no value",
    // and sending "" instead of null would store a blank string in a nullable column.
    handle: profile.handle ?? "",
    bio: profile.bio ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    githubHandle: profile.githubHandle ?? "",
    locale: (LOCALES as readonly string[]).includes(profile.locale)
      ? (profile.locale as (typeof LOCALES)[number])
      : "vi",
    timezone: (TIMEZONES as readonly string[]).includes(profile.timezone)
      ? (profile.timezone as (typeof TIMEZONES)[number])
      : "Asia/Ho_Chi_Minh",
  };
}

export function toUpdateInput(values: ProfileFormValues): UpdateProfileInput {
  return {
    displayName: values.displayName,
    handle: values.handle.toLowerCase() || null,
    bio: values.bio || null,
    websiteUrl: values.websiteUrl || null,
    avatarUrl: values.avatarUrl || null,
    githubHandle: values.githubHandle || null,
    locale: values.locale,
    timezone: values.timezone,
  };
}
