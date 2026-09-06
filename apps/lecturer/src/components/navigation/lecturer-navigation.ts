import {
  BookOpen,
  Braces,
  FileText,
  LayoutDashboard,
  Newspaper,
  Route,
  Sparkles,
  User,
} from "lucide-react";
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
      // Trên danh sách nội dung, không dưới: Lecter là chỗ bắt đầu soạn một bài mới, còn
      // ba mục kia là chỗ quản lý bài đã có.
      { href: "/lecter", icon: Sparkles, label: "Lecter" },
      // Thứ tự đi từ ngoài vào trong: lộ trình chứa khóa học, khóa học chứa bài.
      // Không có mục "Bài học" — `lessons` bắt buộc thuộc một chương nên không tồn tại
      // ngoài khóa học; nó được soạn trong studio khóa học, không phải một màn riêng.
      { href: "/roadmaps", icon: Route, label: "Lộ trình" },
      { href: "/courses", icon: BookOpen, label: "Khóa học" },
      { href: "/exercises", icon: Braces, label: "Bài code" },
      { href: "/articles", icon: Newspaper, label: "Bài viết" },
      // Cuối nhóm, sau bốn mục trên: chúng là nội dung phát hành cho người học, còn Tài liệu
      // là nguyên liệu đầu vào của Lecter và không bao giờ ra tới trang người học.
      { href: "/documents", icon: FileText, label: "Tài liệu" },
    ],
  },
  {
    label: "Tài khoản",
    items: [{ href: "/profile", icon: User, label: "Hồ sơ" }],
  },
];
