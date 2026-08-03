import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type GroupTabKey =
  | "overview"
  | "docs"
  | "exercises"
  | "assignments"
  | "members"
  | "progress"
  | "settings";

export interface GroupTab {
  key: GroupTabKey;
  label: string;
  icon: LucideIcon;
  /** Owner-only tabs are hidden entirely for members, not just disabled. */
  ownerOnly?: boolean;
}

export const GROUP_TABS: GroupTab[] = [
  { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { key: "docs", label: "Tài liệu", icon: FileText },
  { key: "exercises", label: "Bài tập", icon: ClipboardList },
  { key: "assignments", label: "Bài nộp", icon: ClipboardCheck, ownerOnly: true },
  { key: "members", label: "Thành viên", icon: Users },
  { key: "progress", label: "Tiến độ", icon: BarChart3 },
  { key: "settings", label: "Cài đặt", icon: Settings, ownerOnly: true },
];

export function visibleTabs(isOwner: boolean): GroupTab[] {
  return GROUP_TABS.filter((t) => isOwner || !t.ownerOnly);
}

export function resolveTab(raw: string | undefined, isOwner: boolean): GroupTabKey {
  const tabs = visibleTabs(isOwner);
  return tabs.find((t) => t.key === raw)?.key ?? "overview";
}
