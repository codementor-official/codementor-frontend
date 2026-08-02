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
    openTaskCount: 2,
    progressPercent: 59,
    lastActiveLabel: "12 phút trước",
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
    openTaskCount: 4,
    progressPercent: 22,
    lastActiveLabel: "3 giờ trước",
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
    openTaskCount: 3,
    progressPercent: 45,
    lastActiveLabel: "Hôm qua",
    role: "deputy",
    ownerName: "Nguyễn Trung Nguyên",
  },
  {
    id: "python-cho-nguoi-moi",
    tile: "py",
    name: "Python cho Người mới bắt đầu",
    description:
      "Không gian luyện tập Python công khai — ai cũng có thể tham gia và đặt câu hỏi.",
    code: "PY-START",
    topic: "Python cơ bản",
    memberCount: 152,
    openTaskCount: 1,
    progressPercent: 20,
    lastActiveLabel: "2 giờ trước",
    role: "member",
    ownerName: "Lê Minh Anh",
  },
];
