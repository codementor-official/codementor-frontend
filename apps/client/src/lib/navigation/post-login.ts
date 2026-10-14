import type { Role } from "@codementor/types";

/** Bảng điều khiển của từng vai trò. Giảng viên và Admin có app riêng, học viên ở lại đây. */
export interface RoleHomes {
  /** Gốc app Giảng viên, ví dụ `https://lecturer.codementor.cloud`. Trống = không chuyển app. */
  lecturerAppUrl?: string;
  /** Gốc app Admin. Trống = không chuyển app. */
  adminAppUrl?: string;
}

export type PostLoginTarget =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string };

/**
 * `next` chỉ nhận đường dẫn nội bộ bắt đầu bằng đúng một "/": "//evil.com" là URL tuyệt đối
 * với trình duyệt, nên chỉ kiểm ký tự đầu thì trang đăng nhập thành bàn đạp chuyển hướng.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  // Quay lại chính trang đăng nhập/đăng ký là vòng lặp, không phải một đích.
  if (/^\/(login|signup|auth\/)/.test(next)) return null;
  return next;
}

function dashboardOf(base: string | undefined): string | null {
  if (!base) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return new URL("/dashboard", url).toString();
  } catch {
    return null;
  }
}

/**
 * Nơi đưa người dùng tới sau khi đăng nhập thành công.
 *
 * - Có `next` hợp lệ (RequireAuth đặt khi chặn một trang) → về đúng trang đó, mọi vai trò.
 * - Giảng viên / Admin → bảng điều khiển ở app của vai trò đó, nếu app đã được cấu hình.
 * - Còn lại → `/dashboard` của Client (trước đây là `/practice`, không phải trang tổng quan).
 */
export function postLoginTarget(
  role: Role | null | undefined,
  next: string | null | undefined,
  homes: RoleHomes,
): PostLoginTarget {
  const internal = safeNextPath(next);
  if (internal) return { kind: "internal", href: internal };
  const external =
    role === "admin" ? dashboardOf(homes.adminAppUrl) : role === "lecturer" ? dashboardOf(homes.lecturerAppUrl) : null;
  return external ? { kind: "external", href: external } : { kind: "internal", href: "/dashboard" };
}
