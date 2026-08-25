import {
  BookOpen,
  Bot,
  Compass,
  Dumbbell,
  FilePlus2,
  LayoutGrid,
  Map,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";

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

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/explore", label: "Khám phá", icon: Compass },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/roadmaps", label: "Lộ trình", icon: Map },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell },
  { href: "/articles", label: "Bài viết", icon: Newspaper },
  { href: "/workspace", label: "Nhóm học tập", icon: Users },
  { href: "/ai-tutor", label: "Trợ lý AI", icon: Bot },
];
