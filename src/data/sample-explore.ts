export const learningCollections = [
  { icon: "🎨", name: "Frontend Collection", desc: "HTML, CSS, JavaScript và React — từ cơ bản đến dự án thực tế.", count: "42 bài · 6 khóa", tag: "Frontend" },
  { icon: "🏗️", name: "Backend Collection", desc: "API, database và authentication với Node.js và Spring Boot.", count: "38 bài · 5 khóa", tag: "Backend" },
  { icon: "☕", name: "Java Roadmap", desc: "Từ cú pháp Java đến OOP, Collections và lập trình đa luồng.", count: "56 bài · 8 khóa", tag: "Java" },
  { icon: "🌱", name: "Spring Boot Collection", desc: "REST API, JPA, Security và triển khai ứng dụng Spring.", count: "30 bài · 4 khóa", tag: "Spring" },
  { icon: "⚛️", name: "React Collection", desc: "Component, hooks, quản lý state và routing trong React.", count: "34 bài · 5 khóa", tag: "React" },
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

export const communityItems = [
  { icon: "👥", kind: "Nhóm học tập", title: "CLB Lập trình Thi đấu FIT", meta: "210 thành viên đang hoạt động" },
  { icon: "🗺️", kind: "Roadmap nổi bật", title: "Fullstack Developer 2026", meta: "Được 1.2k người theo dõi" },
  { icon: "📄", kind: "Tài liệu đánh giá cao", title: "Big-O cho người mới bắt đầu", meta: "★ 4.9 · 890 lượt lưu" },
  { icon: "🏆", kind: "Challenge trong tuần", title: "Tuần 30: Tối ưu thuật toán sắp xếp", meta: "320 người đang tham gia" },
];
