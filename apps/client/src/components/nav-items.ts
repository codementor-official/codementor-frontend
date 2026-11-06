import {
  BookOpenIcon as BookOpen,
  CertificateIcon as Certificate,
  BookmarkSimpleIcon as Bookmark,
  ReceiptIcon as Receipt,
  RobotIcon as Bot,
  CompassIcon as Compass,
  BarbellIcon as Dumbbell,
  FilePlusIcon as FilePlus2,
  SquaresFourIcon as LayoutGrid,
  MapTrifoldIcon as Map,
  NewspaperIcon as Newspaper,
  UsersIcon as Users,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

/**
 * AUTHORING — pending a product decision.
 *
 * The sidebar's elevated "Tạo bài tập" action was removed on 2026-08-16: it is not settled
 * whether a learner may author and contribute lessons, and a nav slot is a strong claim that
 * they may. The route and its forms are intact, reachable only by URL, so turning it back on
 * is re-adding one entry to `navItems` (or restoring the elevated action in `Sidebar`).
 *
 * Components that exist only for that flow, and that should be revisited — kept or deleted —
 * with the same decision:
 *   - app/(app)/create-problem/page.tsx
 *   - components/create-problem/*            (code-problem-form, theory-lesson-form, tab nav)
 *   - app/(app)/lessons/[lessonId]/page.tsx  (renders an authored theory lesson)
 *   - data/authored-problems.ts              (that lesson page is its only consumer now)
 */
export const createAction = { href: "/create-problem", label: "Tạo bài tập", icon: FilePlus2 };

export const navItems: { href: string; label: string; icon: PhosphorIcon }[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/explore", label: "Khám phá", icon: Compass },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/roadmaps", label: "Lộ trình", icon: Map },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell },
  { href: "/articles", label: "Bài viết", icon: Newspaper },
  { href: "/workspace", label: "Nhóm học tập", icon: Users },
  { href: "/saved", label: "Đã lưu", icon: Bookmark },
  { href: "/purchases", label: "Khóa học đã mua", icon: Receipt },
  { href: "/my-certificates", label: "Chứng chỉ", icon: Certificate },
  { href: "/ai-tutor", label: "Trợ lý AI", icon: Bot },
];
