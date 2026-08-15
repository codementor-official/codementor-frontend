import { BookOpen, Braces, GraduationCap, LayoutDashboard, Route, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LecturerNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface LecturerNavGroup {
  label: string;
  items: LecturerNavItem[];
}

/**
 * Two groups, deliberately. The admin console needs six because it governs the whole
 * platform; a lecturer does two things — prepare teaching material and manage their
 * own account — and a sidebar that implies more than that is a sidebar people stop
 * reading.
 */
export const lecturerNavigation: LecturerNavGroup[] = [
  {
    label: "Giảng dạy",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
      { href: "/courses", icon: BookOpen, label: "Khóa học" },
      { href: "/lessons", icon: GraduationCap, label: "Bài học" },
      { href: "/exercises", icon: Braces, label: "Bài code" },
      { href: "/roadmaps", icon: Route, label: "Lộ trình" },
    ],
  },
  {
    label: "Tài khoản",
    items: [{ href: "/profile", icon: User, label: "Hồ sơ" }],
  },
];
