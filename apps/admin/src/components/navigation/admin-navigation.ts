import {
  Activity,
  BookOpen,
  Bot,
  Braces,
  FileText,
  Flag,
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
    // Bốn mục, không phải một: hàng chờ trả lời "còn gì phải xem hôm nay", còn ba mục kia
    // là nơi tìm lại thứ đã quyết định rồi — gỡ một khoá lỡ duyệt, duyệt lại một bài đã
    // từ chối. Trước đây chỉ có hàng chờ, nên hai việc đó không có chỗ nào để bắt đầu.
    label: "Kiểm duyệt",
    items: [
      { href: "/moderation", icon: ShieldCheck, label: "Hàng chờ duyệt" },
      { href: "/moderation/exercises", icon: Braces, label: "Bài code" },
      { href: "/moderation/courses", icon: BookOpen, label: "Khoá học" },
      { href: "/moderation/roadmaps", icon: Route, label: "Lộ trình" },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/users", icon: Users, label: "Người dùng" },
      { href: "/workspaces", icon: Network, label: "Nhóm học tập" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { href: "/posts", icon: Newspaper, label: "Bài viết" },
      { href: "/documents", icon: FileText, label: "Tài liệu" },
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
