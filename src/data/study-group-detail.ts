import type {
  Assignment,
  GroupActivity,
  GroupDetail,
  GroupDocument,
  GroupExercise,
  GroupMember,
  RolePermissions,
} from "@/types/study-group-detail";

const members: GroupMember[] = [
  {
    id: "gia-si",
    name: "Nguyễn Trần Gia Sĩ",
    initials: "GS",
    role: "owner",
    progressPercent: 92,
    xp: 2450,
    solvedCount: 44,
    streakDays: 12,
    joinedAt: "02/03/2026",
    lastActiveMinutesAgo: 5,
    achievements: [
      { label: "Chuỗi ngày dài nhất", value: "12 ngày", hint: "Kỷ lục cá nhân trong nhóm" },
      { label: "Tỷ lệ bài đạt", value: "88%", hint: "39/44 bài đạt ngay lần nộp đầu" },
      { label: "Chủ đề mạnh nhất", value: "Vòng lặp", hint: "18/20 bài đã giải" },
      { label: "Chủ đề cần ôn", value: "Đệ quy", hint: "4/16 bài đã giải" },
    ],
  },
  {
    id: "trung-nguyen",
    name: "Nguyễn Trung Nguyên",
    initials: "TN",
    role: "deputy",
    progressPercent: 78,
    xp: 1890,
    solvedCount: 36,
    streakDays: 5,
    joinedAt: "04/03/2026",
    lastActiveMinutesAgo: 45,
    achievements: [
      { label: "Chuỗi ngày dài nhất", value: "9 ngày", hint: "Đang giữ chuỗi 5 ngày" },
      { label: "Tỷ lệ bài đạt", value: "81%", hint: "29/36 bài đạt ngay lần nộp đầu" },
      { label: "Chủ đề mạnh nhất", value: "Mảng", hint: "16/22 bài đã giải" },
      { label: "Chủ đề cần ôn", value: "Con trỏ", hint: "3/14 bài đã giải" },
    ],
  },
  {
    id: "van-b",
    name: "Trần Văn B",
    initials: "VB",
    role: "member",
    progressPercent: 45,
    xp: 940,
    solvedCount: 19,
    streakDays: 2,
    joinedAt: "04/03/2026",
    lastActiveMinutesAgo: 300,
    achievements: [
      { label: "Chuỗi ngày dài nhất", value: "4 ngày", hint: "Cần luyện đều hơn" },
      { label: "Tỷ lệ bài đạt", value: "63%", hint: "12/19 bài đạt ngay lần nộp đầu" },
      { label: "Chủ đề mạnh nhất", value: "Cấu trúc điều kiện", hint: "9/12 bài đã giải" },
      { label: "Chủ đề cần ôn", value: "Đệ quy", hint: "1/16 bài đã giải" },
    ],
  },
  {
    id: "thi-c",
    name: "Lê Thị C",
    initials: "TC",
    role: "member",
    progressPercent: 60,
    xp: 1210,
    solvedCount: 24,
    streakDays: 5,
    joinedAt: "11/03/2026",
    lastActiveMinutesAgo: 90,
    achievements: [
      { label: "Chuỗi ngày dài nhất", value: "7 ngày", hint: "Đang giữ chuỗi 5 ngày" },
      { label: "Tỷ lệ bài đạt", value: "70%", hint: "17/24 bài đạt ngay lần nộp đầu" },
      { label: "Chủ đề mạnh nhất", value: "Chuỗi", hint: "11/15 bài đã giải" },
      { label: "Chủ đề cần ôn", value: "Sắp xếp", hint: "2/12 bài đã giải" },
    ],
  },
  {
    id: "van-d",
    name: "Phạm Văn D",
    initials: "VD",
    role: "member",
    progressPercent: 20,
    xp: 410,
    solvedCount: 8,
    streakDays: 0,
    joinedAt: "20/03/2026",
    lastActiveMinutesAgo: 2880,
    achievements: [
      { label: "Chuỗi ngày dài nhất", value: "2 ngày", hint: "Chưa có chuỗi nào đáng kể" },
      { label: "Tỷ lệ bài đạt", value: "50%", hint: "4/8 bài đạt ngay lần nộp đầu" },
      { label: "Chủ đề mạnh nhất", value: "Biến & kiểu dữ liệu", hint: "4/6 bài đã giải" },
      { label: "Chủ đề cần ôn", value: "Mảng", hint: "1/22 bài đã giải" },
    ],
  },
];

const documents: GroupDocument[] = [
  {
    id: "de-cuong",
    title: "Đề cương môn học.pdf",
    type: "PDF",
    topic: "Tổng quan môn học",
    uploaderName: "Lê Minh Anh",
    uploadedAt: "22/07/2026",
    sizeLabel: "2,1 MB",
    previewText: `# Đề cương môn học Nhập môn Lập trình

**Thời lượng:** 15 tuần · 45 tiết

## Chương 1 — Biến và kiểu dữ liệu
- Khai báo biến, hằng số
- Các kiểu dữ liệu cơ bản và ép kiểu

## Chương 2 — Cấu trúc điều kiện
- Câu lệnh \`if\` / \`else if\` / \`else\`
- Câu lệnh \`switch\` và các bẫy thường gặp

## Chương 3 — Vòng lặp
- \`for\`, \`while\`, \`do-while\`
- Vòng lặp lồng nhau và độ phức tạp

## Đánh giá
Giữa kỳ 30% · Bài tập nhóm 20% · Cuối kỳ 50%`,
    status: "published",
    verdict: "valid",
  },
  {
    id: "slide-buoi-4",
    title: "Slide buổi 4 - Cấu trúc điều kiện.pptx",
    type: "Slide",
    topic: "Cấu trúc điều kiện",
    uploaderName: "Lê Minh Anh",
    uploadedAt: "21/07/2026",
    sizeLabel: "5,4 MB",
    previewText: `# Buổi 4 — Cấu trúc điều kiện

## Mục tiêu
- Hiểu luồng rẽ nhánh
- Viết được điều kiện lồng nhau

## Nội dung chính
- So sánh và toán tử logic
- \`if\` / \`else\` / \`switch\`
- Bài tập: giải phương trình bậc hai`,
    status: "published",
    verdict: "valid",
  },
  {
    id: "ghi-chu",
    title: "Ghi chú tự soạn.md",
    type: "Markdown",
    topic: "Vòng lặp",
    uploaderName: "Nguyễn Trần Gia Sĩ",
    uploadedAt: "23/07/2026",
    sizeLabel: "14 KB",
    previewText: `# Ghi chú: Vòng lặp

Điểm hay nhầm khi mới học:

1. **Sai điều kiện dừng** — \`i <= n\` với mảng 0-based sẽ vượt chỉ số.
2. **Quên cập nhật biến đếm** trong \`while\` → lặp vô hạn.
3. Vòng lặp lồng nhau: độ phức tạp là **O(n²)**, không phải O(2n).

\`\`\`c
for (int i = 0; i < n; i++) {
  // thân vòng lặp
}
\`\`\`

> Mẹo: viết ra giá trị của biến đếm sau mỗi vòng để kiểm tra.`,
    status: "published",
    verdict: "valid",
  },
  {
    id: "video-de-quy",
    title: "Buổi ôn tập trực tuyến - Đệ quy.mp4",
    type: "Video",
    topic: "Đệ quy",
    uploaderName: "Lê Minh Anh",
    uploadedAt: "19/07/2026",
    sizeLabel: "340 MB",
    status: "pending",
    verdict: "warning",
  },
  {
    id: "bai-viet-big-o",
    title: "Bài viết: Big-O cho người mới bắt đầu",
    type: "Link",
    topic: "Độ phức tạp",
    uploaderName: "Nguyễn Trung Nguyên",
    uploadedAt: "17/07/2026",
    sizeLabel: "Liên kết ngoài",
    url: "https://example.com/big-o-cho-nguoi-moi",
    status: "pending",
    verdict: "warning",
  },
  {
    id: "bang-diem",
    title: "Bảng điểm thực hành nhóm.xlsx",
    type: "Bảng tính",
    topic: "Quản lý nhóm",
    uploaderName: "Lê Thị C",
    uploadedAt: "23/07/2026",
    sizeLabel: "96 KB",
    status: "changes",
    verdict: "warning",
  },
  {
    id: "quang-cao",
    title: "Quảng cáo khóa học bên ngoài.pdf",
    type: "PDF",
    topic: "Chưa phân loại",
    uploaderName: "Trần Văn B",
    uploadedAt: "22/07/2026",
    sizeLabel: "1,2 MB",
    status: "rejected",
    verdict: "invalid",
  },
];

const exercises: GroupExercise[] = [
  {
    id: "phuong-trinh-bac-hai",
    title: "Giải Phương trình Bậc hai",
    difficulty: "Cơ bản",
    source: "ai",
    status: "published",
    topic: "Cấu trúc điều kiện",
    xp: 50,
    dueAt: "2026-07-22",
    assignedCount: 3,
    completedCount: 1,
  },
  {
    id: "tong-phan-tu-mang",
    title: "Tính tổng phần tử mảng",
    difficulty: "Cơ bản",
    source: "manual",
    status: "published",
    topic: "Mảng",
    xp: 30,
    dueAt: "2026-07-28",
    assignedCount: 4,
    completedCount: 1,
  },
  {
    id: "kiem-tra-so-nguyen-to",
    title: "Kiểm tra số nguyên tố",
    difficulty: "Trung bình",
    source: "ai",
    status: "draft",
    topic: "Vòng lặp",
    xp: 60,
    dueAt: "2026-08-05",
    assignedCount: 0,
    completedCount: 0,
  },
  {
    id: "dao-nguoc-danh-sach",
    title: "Đảo ngược danh sách liên kết",
    difficulty: "Nâng cao",
    source: "manual",
    status: "closed",
    topic: "Cấu trúc dữ liệu",
    xp: 80,
    dueAt: "2026-07-18",
    assignedCount: 2,
    completedCount: 1,
  },
  {
    id: "xoay-mang",
    title: "Xoay mảng k vị trí",
    difficulty: "Trung bình",
    source: "manual",
    status: "published",
    topic: "Mảng",
    xp: 60,
    dueAt: null,
    assignedCount: 0,
    completedCount: 0,
  },
];

const assignments: Assignment[] = [
  {
    id: "a-1",
    exerciseId: "phuong-trinh-bac-hai",
    memberId: "trung-nguyen",
    status: "done",
    reviewStatus: "approved",
    feedback: "Code sạch, xử lý đủ 3 nhánh delta. Ghi nhận hoàn thành.",
    submissions: [
      { version: 1, submittedAt: "19/07/2026 22:03", result: "Không đạt", detail: "3/5 kiểm thử · thiếu nhánh delta < 0", isLate: false },
      { version: 2, submittedAt: "20/07/2026 21:14", result: "Đạt", detail: "5/5 kiểm thử · 11ms", isLate: false },
    ],
  },
  {
    id: "a-2",
    exerciseId: "phuong-trinh-bac-hai",
    memberId: "van-b",
    status: "inprogress",
    reviewStatus: "needsfix",
    feedback: "Chưa xử lý sai số khi so sánh delta == 0, xem lại gợi ý mức 2.",
    submissions: [
      { version: 1, submittedAt: "18/07/2026 09:40", result: "Không đạt", detail: "2/5 kiểm thử", isLate: false },
      { version: 2, submittedAt: "20/07/2026 14:22", result: "Không đạt", detail: "3/5 kiểm thử", isLate: false },
      { version: 3, submittedAt: "23/07/2026 08:05", result: "Không đạt", detail: "4/5 kiểm thử · sai số thực", isLate: true },
    ],
  },
  {
    id: "a-3",
    exerciseId: "phuong-trinh-bac-hai",
    memberId: "thi-c",
    status: "late",
    reviewStatus: "pending",
    feedback: "",
    submissions: [],
  },
  {
    id: "a-4",
    exerciseId: "tong-phan-tu-mang",
    memberId: "trung-nguyen",
    status: "done",
    reviewStatus: "approved",
    feedback: "",
    submissions: [
      { version: 1, submittedAt: "19/07/2026 20:10", result: "Đạt", detail: "4/4 kiểm thử · 8ms", isLate: false },
    ],
  },
  {
    id: "a-5",
    exerciseId: "tong-phan-tu-mang",
    memberId: "van-b",
    status: "inprogress",
    reviewStatus: "pending",
    feedback: "",
    submissions: [
      { version: 1, submittedAt: "22/07/2026 19:55", result: "Không đạt", detail: "2/4 kiểm thử", isLate: false },
    ],
  },
  {
    id: "a-6",
    exerciseId: "tong-phan-tu-mang",
    memberId: "thi-c",
    status: "notstarted",
    reviewStatus: "pending",
    feedback: "",
    submissions: [],
  },
  {
    id: "a-7",
    exerciseId: "tong-phan-tu-mang",
    memberId: "van-d",
    status: "notstarted",
    reviewStatus: "pending",
    feedback: "",
    submissions: [],
  },
  {
    id: "a-8",
    exerciseId: "dao-nguoc-danh-sach",
    memberId: "van-b",
    status: "done",
    reviewStatus: "approved",
    feedback: "Đảo ngược đúng, không dùng mảng phụ.",
    submissions: [
      { version: 1, submittedAt: "17/07/2026 23:47", result: "Đạt", detail: "6/6 kiểm thử", isLate: false },
    ],
  },
  {
    id: "a-9",
    exerciseId: "dao-nguoc-danh-sach",
    memberId: "van-d",
    status: "late",
    reviewStatus: "pending",
    feedback: "",
    submissions: [],
  },
];

const activities: GroupActivity[] = [
  { id: "act-1", actor: "Nguyễn Trung Nguyên", action: "đã nộp bài “Tính tổng phần tử mảng”", minutesAgo: 12 },
  { id: "act-2", actor: "Lê Minh Anh", action: "đã tải lên “Slide buổi 4”", minutesAgo: 180 },
  { id: "act-3", actor: "Trần Văn B", action: "đạt chuỗi 5 ngày luyện tập liên tiếp", minutesAgo: 1500 },
  { id: "act-4", actor: "Trợ lý AI", action: "đề xuất bài tập mới “Kiểm tra số nguyên tố”", minutesAgo: 2880 },
];

const permissions: RolePermissions = {
  deputy: {
    uploadDoc: true,
    createExercise: true,
    editExercise: true,
    deleteDoc: false,
    reviewSubmission: true,
    removeMember: false,
  },
  member: {
    uploadDoc: true,
    createExercise: false,
    editExercise: false,
    deleteDoc: false,
    reviewSubmission: false,
    removeMember: false,
  },
};

export const groupDetail: GroupDetail = {
  documents,
  exercises,
  members,
  assignments,
  activities,
  permissions,
  submissionTrend: [
    { label: "T2", value: 6 },
    { label: "T3", value: 11 },
    { label: "T4", value: 8 },
    { label: "T5", value: 14 },
    { label: "T6", value: 19 },
    { label: "T7", value: 9 },
    { label: "CN", value: 4 },
  ],
  createdAt: "02/03/2026",
  currentTopic: "Cấu trúc điều kiện & Vòng lặp",
};
