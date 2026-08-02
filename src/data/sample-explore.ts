import { Atom, Coffee, FileText, Map, Palette, Server, Sprout, Trophy, Users, type LucideIcon } from "lucide-react";

export const learningCollections: {
  icon: LucideIcon;
  name: string;
  desc: string;
  count: string;
  tag: string;
}[] = [
  { icon: Palette, name: "Frontend Collection", desc: "HTML, CSS, JavaScript và React — từ cơ bản đến dự án thực tế.", count: "42 bài · 6 khóa", tag: "Frontend" },
  { icon: Server, name: "Backend Collection", desc: "API, database và authentication với Node.js và Spring Boot.", count: "38 bài · 5 khóa", tag: "Backend" },
  { icon: Coffee, name: "Java Roadmap", desc: "Từ cú pháp Java đến OOP, Collections và lập trình đa luồng.", count: "56 bài · 8 khóa", tag: "Java" },
  { icon: Sprout, name: "Spring Boot Collection", desc: "REST API, JPA, Security và triển khai ứng dụng Spring.", count: "30 bài · 4 khóa", tag: "Spring" },
  { icon: Atom, name: "React Collection", desc: "Component, hooks, quản lý state và routing trong React.", count: "34 bài · 5 khóa", tag: "React" },
];

export const popularProblems = [
  {
    tile: "√",
    tileVariant: "primary" as const,
    title: "Giải Phương trình Bậc hai",
    meta: "4.502 lượt làm",
    difficulty: "Cơ bản" as const,
    href: "/solve/giai-phuong-trinh-bac-hai",
  },
  {
    tile: "↻",
    tileVariant: "navy" as const,
    title: "Xoay Mảng",
    meta: "2.890 lượt làm",
    difficulty: "Trung bình" as const,
    href: "/solve/xoay-mang",
  },
  {
    tile: "aba",
    tileVariant: "accent" as const,
    title: "Kiểm tra Chuỗi Đối xứng",
    meta: "3.340 lượt làm",
    difficulty: "Cơ bản" as const,
    href: "/solve/kiem-tra-chuoi-doi-xung",
  },
  {
    tile: "⇥",
    tileVariant: "primary" as const,
    title: "Cài đặt Tìm kiếm Nhị phân",
    meta: "1.655 lượt làm",
    difficulty: "Nâng cao" as const,
    href: "/solve/tim-kiem-nhi-phan",
  },
];

export const recommendedTopics = [
  "React Hooks",
  "CSS Grid",
  "TypeScript",
  "REST API",
  "JWT Auth",
  "SQL nâng cao",
  "Docker",
  "Big-O",
];

export const communityItems: {
  icon: LucideIcon;
  kind: string;
  title: string;
  meta: string;
  rating?: string;
}[] = [
  { icon: Users, kind: "Nhóm học tập", title: "CLB Lập trình Thi đấu FIT", meta: "210 thành viên đang hoạt động" },
  { icon: Map, kind: "Roadmap nổi bật", title: "Fullstack Developer 2026", meta: "Được 1.2k người theo dõi" },
  { icon: FileText, kind: "Tài liệu đánh giá cao", title: "Big-O cho người mới bắt đầu", meta: "890 lượt lưu", rating: "4.9" },
  { icon: Trophy, kind: "Challenge trong tuần", title: "Tuần 30: Tối ưu thuật toán sắp xếp", meta: "320 người đang tham gia" },
];

export const topLearners: { rank: number; name: string; xp: string; solved: number }[] = [
  { rank: 1, name: "Trần Minh Khoa", xp: "12.480", solved: 214 },
  { rank: 2, name: "Nguyễn Hải Yến", xp: "11.902", solved: 198 },
  { rank: 3, name: "Phạm Quốc Bảo", xp: "10.355", solved: 181 },
  { rank: 4, name: "Lê Thu Trang", xp: "9.720", solved: 167 },
  { rank: 5, name: "Đỗ Gia Sĩ", xp: "8.940", solved: 152 },
];

export const latestArticles: { title: string; excerpt: string; author: string; readMinutes: number; tag: string }[] = [
  {
    title: "Hiểu Big-O trong 10 phút, không cần toán cao cấp",
    excerpt: "Cách ước lượng độ phức tạp thuật toán bằng trực giác trước khi đụng tới công thức.",
    author: "Nguyễn Minh Anh",
    readMinutes: 8,
    tag: "Thuật toán",
  },
  {
    title: "7 lỗi CSS layout khiến giao diện vỡ trên mobile",
    excerpt: "Những bẫy phổ biến với Flexbox, Grid và overflow — kèm cách sửa từng trường hợp.",
    author: "Trần Gia Bảo",
    readMinutes: 11,
    tag: "Frontend",
  },
  {
    title: "REST API: đặt tên endpoint sao cho người sau còn hiểu",
    excerpt: "Quy ước đặt tên, phiên bản hóa và mã lỗi nhất quán cho API thực tế.",
    author: "Lê Thị Hồng Nhung",
    readMinutes: 9,
    tag: "Backend",
  },
];
