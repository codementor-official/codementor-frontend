import { FileText, Map, Trophy, Users, type LucideIcon } from "lucide-react";
import { practiceItems } from "@/data/practice-items";

export { articles as latestArticles } from "@/data/articles";

/** Shared catalogue keeps Explore and Luyện tập consistent as new mock exercises are added. */
export const popularProblems = [...practiceItems]
  .sort((left, right) => right.popularity - left.popularity)
  .map((item) => ({
    tile: item.tile,
    tileVariant: item.tileVariant,
    title: item.title,
    meta: `${item.participants} lượt làm · ${item.estimatedMinutes} phút`,
    difficulty: item.difficulty,
    href: item.href ?? "/practice",
  }));

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
  { icon: Users, kind: "Nhóm học tập", title: "CLB Lập trình Thi Đấu FIT", meta: "210 thành viên đang hoạt động" },
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
