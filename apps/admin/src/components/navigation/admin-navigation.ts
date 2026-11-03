import {
  PulseIcon as Activity,
  ChartLineUpIcon as ChartNoAxesCombined,
  SealPercentIcon as BadgePercent,
  BookOpenIcon as BookOpen,
  RobotIcon as Bot,
  BracketsCurlyIcon as Braces,
  FlagIcon as Flag,
  DiamondIcon as Gem,
  SquaresFourIcon as LayoutDashboard,
  GraphIcon as Network,
  NewspaperIcon as Newspaper,
  PathIcon as Route,
  ScrollIcon as ScrollText,
  GearIcon as Settings,
  ShieldCheckIcon as ShieldCheck,
  UsersIcon as Users,
  WalletIcon as Wallet,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export interface AdminNavItem {
  href: string;
  icon: PhosphorIcon;
  label: string;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/**
 * Đường dẫn giữ nguyên tiếng Anh, chỉ nhãn hiển thị là tiếng Việt: URL là một phần giao
 * kèo với trình duyệt (dấu trang, lịch sử, liên kết đã gửi đi), còn nhãn thì không.
 */
export const adminNavigation: AdminNavGroup[] = [
  {
    label: "Tổng quan",
    items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" }],
  },
  {
    label: "Kiểm duyệt",
    items: [{ href: "/moderation", icon: ShieldCheck, label: "Hàng chờ duyệt" }],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/users", icon: Users, label: "Người dùng" },
      { href: "/courses", icon: BookOpen, label: "Khoá học" },
      { href: "/learning-paths", icon: Route, label: "Lộ trình học" },
      { href: "/workspaces", icon: Network, label: "Nhóm học tập" },
      { href: "/commerce", icon: Wallet, label: "Giao dịch" },
      { href: "/revenue", icon: ChartNoAxesCombined, label: "Doanh thu hệ thống" },
      { href: "/promotions", icon: BadgePercent, label: "Khuyến mãi" },
      { href: "/workspace-plans", icon: Gem, label: "Gói Workspace" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { href: "/posts", icon: Newspaper, label: "Bài viết" },
      { href: "/exercises", icon: Braces, label: "Bài tập" },
    ],
  },
  {
    label: "Nền tảng",
    items: [
      { href: "/ai-operations", icon: Bot, label: "Vận hành AI" },
      { href: "/code-judge", icon: Braces, label: "Chấm bài" },
      { href: "/system-activity", icon: Activity, label: "Hoạt động hệ thống" },
    ],
  },
  {
    label: "Giám sát",
    items: [
      { href: "/reports", icon: Flag, label: "Báo cáo vi phạm" },
      { href: "/audit-logs", icon: ScrollText, label: "Nhật ký kiểm toán" },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ href: "/settings", icon: Settings, label: "Cài đặt" }],
  },
];
