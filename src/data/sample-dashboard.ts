export const dashStats = [
  { label: "Chuỗi ngày", value: "5", sub: "Kỷ lục: 12 ngày" },
  { label: "Mục tiêu tuần", value: "3/5h", sub: "60% hoàn thành" },
  { label: "Tổng XP", value: "2.450", sub: "Hạng #3 trong nhóm" },
  { label: "Bài đã giải", value: "47", sub: "Trên 6 chủ đề" },
];

export const continueLearning = [
  {
    tile: "√",
    tileVariant: "primary" as const,
    title: "Giải Phương trình Bậc hai",
    progress: 88,
    href: "/solve/giai-phuong-trinh-bac-hai",
  },
  {
    tile: "↻",
    tileVariant: "navy" as const,
    title: "Xoay Mảng",
    progress: 42,
    href: "/solve/xoay-mang",
  },
];

export const recommendedProblems = [
  {
    tile: "Δ",
    tileVariant: "primary" as const,
    title: "Trường hợp đặc biệt của Delta",
    meta: "Tỷ lệ chấp nhận 78% · 980 lượt làm",
    difficulty: "Cơ bản" as const,
    href: "/solve/truong-hop-dac-biet-cua-delta",
  },
  {
    tile: "Æ",
    tileVariant: "navy" as const,
    title: "Fibonacci có Ghi nhớ",
    meta: "Tỷ lệ chấp nhận 64% · 1.203 lượt làm",
    difficulty: "Trung bình" as const,
    href: "/solve/fibonacci-co-ghi-nho",
  },
  {
    tile: "#",
    tileVariant: "primary" as const,
    title: "Số nguyên tố trong khoảng",
    meta: "Tỷ lệ chấp nhận 71% · 1.540 lượt làm",
    difficulty: "Cơ bản" as const,
    href: "/solve/so-nguyen-to-trong-khoang",
  },
];

export const weeklyGoal = { targetH: 5, doneH: 3, pct: 60 };

export const streakCells = [
  { label: "T2", active: true },
  { label: "T3", active: true },
  { label: "T4", active: true },
  { label: "T5", active: true },
  { label: "T6", active: true },
  { label: "T7", active: false },
  { label: "CN", active: false },
];

export const dashDeadlines = [
  { title: "Bài tập Đệ quy", deadline: "22/07/2026", group: "Nhóm Nhập môn Lập trình", overdue: false },
  { title: "Kiểm tra Số nguyên tố", deadline: "05/08/2026", group: "Nhóm Nhập môn Lập trình", overdue: false },
];

export const recentlyViewed = [
  { tile: "{ }", title: "Nhập môn Lập trình", meta: "Lộ trình · Hôm qua", href: "/paths/nhap-mon" },
  { tile: "Σ", title: "Tính tổng phần tử mảng", meta: "Bài luyện tập · 2 ngày trước", href: "/practice" },
];

export const popularTopics = [
  "Vòng lặp",
  "Mảng",
  "Đệ quy",
  "Lập trình hướng đối tượng",
  "Con trỏ",
  "Chuỗi",
  "Sắp xếp",
  "Danh sách liên kết",
];
