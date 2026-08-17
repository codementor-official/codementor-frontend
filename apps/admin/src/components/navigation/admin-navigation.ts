import {
  Activity,
  BookOpen,
  Bot,
  Braces,
  FileText,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Network,
  Newspaper,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AdminNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavigation: AdminNavGroup[] = [
  {
    label: "General",
    items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Moderation",
    items: [{ href: "/moderation", icon: ShieldCheck, label: "Kiểm duyệt" }],
  },
  {
    label: "Management",
    items: [
      { href: "/users", icon: Users, label: "Users" },
      { href: "/lecturers", icon: GraduationCap, label: "Lecturers" },
      { href: "/courses", icon: BookOpen, label: "Courses" },
      { href: "/learning-paths", icon: Route, label: "Learning Paths" },
      { href: "/workspaces", icon: Network, label: "Workspaces" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/posts", icon: Newspaper, label: "Posts" },
      { href: "/exercises", icon: Braces, label: "Exercises" },
      { href: "/documents", icon: FileText, label: "Documents" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/ai-operations", icon: Bot, label: "AI Operations" },
      { href: "/code-judge", icon: Braces, label: "Code Judge" },
      { href: "/system-activity", icon: Activity, label: "System Activity" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/reports", icon: Flag, label: "Reports" },
      { href: "/audit-logs", icon: ScrollText, label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", icon: Settings, label: "Settings" }],
  },
];
