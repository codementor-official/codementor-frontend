import { z } from "zod";
import type { User } from "@codementor/types";

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
  handle: z
    .string()
    .trim()
    .regex(
      /^(|[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9]))$/,
      "3–30 ký tự, chỉ chữ thường, số, gạch ngang hoặc gạch dưới",
    ),
  bio: z.string().trim().max(2000, "Tối đa 2000 ký tự"),
  websiteUrl: z.string().trim().refine(isBlankOrHttpUrl, "Phải bắt đầu bằng http:// hoặc https://"),
  avatarUrl: z.string().trim().refine(isBlankOrHttpUrl, "Phải bắt đầu bằng http:// hoặc https://"),
  githubHandle: z
    .string()
    .trim()
    .regex(/^(|[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$/, "Tên GitHub không hợp lệ"),
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

function isBlankOrHttpUrl(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
    handle: values.handle || null,
    bio: values.bio || null,
    websiteUrl: values.websiteUrl || null,
    avatarUrl: values.avatarUrl || null,
    githubHandle: values.githubHandle || null,
    locale: values.locale,
    timezone: values.timezone,
  };
}
