import type { StudyGroup } from "@/types/study-group";

/** Signed-in user in the mock — used to fill `ownerName` on groups you own. */
export const CURRENT_USER_NAME = "Nguyễn Trần Gia Sĩ";

export const studyGroups: StudyGroup[] = [
  {
    id: "nhap-mon-lt",
    tile: "{ }",
    name: "Nhóm Nhập môn Lập trình",
    description:
      "Cùng nhau luyện phần nền tảng: biến, cấu trúc điều kiện và vòng lặp bằng C/C++.",
    code: "NMLT-BASIC",
    topic: "Cấu trúc điều kiện",
    memberCount: 5,
    memberPreview: [
      { id: "gia-si", initials: "GS", name: "Nguyễn Trần Gia Sĩ" },
      { id: "trung-nguyen", initials: "TN", name: "Nguyễn Trung Nguyên" },
      { id: "van-b", initials: "VB", name: "Trần Văn B" },
      { id: "thi-c", initials: "TC", name: "Lê Thị C" },
      { id: "van-d", initials: "VD", name: "Phạm Văn D" },
    ],
    openTaskCount: 2,
    progressPercent: 59,
    lastActiveMinutesAgo: 12,
    role: "owner",
    ownerName: CURRENT_USER_NAME,
  },
  {
    id: "on-thi-dsa",
    tile: "DS",
    name: "Ôn tập Cấu trúc Dữ liệu cuối kỳ",
    description:
      "Luyện đề và ôn khái niệm mảng, danh sách liên kết trước kỳ thi cuối kỳ.",
    code: "DSA-CK-2026",
    topic: "Cấu trúc dữ liệu",
    memberCount: 3,
    memberPreview: [
      { id: "gia-si", initials: "GS", name: "Nguyễn Trần Gia Sĩ" },
      { id: "thi-c", initials: "TC", name: "Lê Thị C" },
      { id: "van-d", initials: "VD", name: "Phạm Văn D" },
    ],
    openTaskCount: 4,
    progressPercent: 22,
    lastActiveMinutesAgo: 180,
    role: "owner",
    ownerName: CURRENT_USER_NAME,
  },
  {
    id: "hoi-on-thi-dsa",
    tile: "OJ",
    name: "Hội Ôn thi Cấu trúc Dữ liệu",
    description:
      "Nhóm tự phát ôn thi cuối kỳ, luyện đề mỗi tối và chữa bài cùng nhau.",
    code: "HOI-DSA-01",
    topic: "Giải thuật",
    memberCount: 34,
    memberPreview: [
      { id: "trung-nguyen", initials: "TN", name: "Nguyễn Trung Nguyên" },
      { id: "gia-si", initials: "GS", name: "Nguyễn Trần Gia Sĩ" },
      { id: "minh-anh", initials: "MA", name: "Lê Minh Anh" },
      { id: "quoc-bao", initials: "QB", name: "Phạm Quốc Bảo" },
    ],
    openTaskCount: 3,
    progressPercent: 45,
    lastActiveMinutesAgo: 1500,
    role: "deputy",
    ownerName: "Nguyễn Trung Nguyên",
  },
  {
    id: "python-cho-nguoi-moi",
    tile: "py",
    name: "Python cho Người mới bắt đầu",
    description:
      "Nhóm luyện tập Python công khai — ai cũng có thể tham gia và đặt câu hỏi.",
    code: "PY-START",
    topic: "Python cơ bản",
    memberCount: 152,
    memberPreview: [
      { id: "minh-anh", initials: "MA", name: "Lê Minh Anh" },
      { id: "gia-si", initials: "GS", name: "Nguyễn Trần Gia Sĩ" },
      { id: "thu-trang", initials: "TT", name: "Lê Thu Trang" },
      { id: "gia-si-2", initials: "GS", name: "Đỗ Gia Sĩ" },
    ],
    openTaskCount: 1,
    progressPercent: 20,
    lastActiveMinutesAgo: 120,
    role: "member",
    ownerName: "Lê Minh Anh",
  },
];
