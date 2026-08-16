import {
  BookOpen,
  Bot,
  Compass,
  Dumbbell,
  FilePlus2,
  LayoutGrid,
  Map,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Rendered as the elevated "+" action above the nav list (see `Sidebar`) — not repeated here. */
export const createAction = { href: "/create-problem", label: "Tạo bài tập", icon: FilePlus2 };

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/explore", label: "Khám phá", icon: Compass },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/paths", label: "Lộ trình", icon: Map },
  { href: "/practice", label: "Luyện tập", icon: Dumbbell },
  { href: "/workspace", label: "Nhóm học tập", icon: Users },
  { href: "/ai-tutor", label: "Trợ lý AI", icon: Bot },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];
