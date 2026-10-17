import type {
  AdminContentReport,
  ReportCategory,
  ReportStatus,
  ReportTargetType,
} from "@/lib/api";

export const STATUS: Record<ReportStatus, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã xử lý vi phạm",
  REJECTED: "Không vi phạm",
};
export const STATUS_TONE = {
  PENDING: "warning",
  RESOLVED: "success",
  REJECTED: "neutral",
} as const;
export const TARGET: Record<ReportTargetType, string> = {
  DOCUMENT: "Tài liệu nhóm",
  POST: "Bài viết",
  COURSE: "Khóa học",
  ROADMAP: "Lộ trình",
  EXERCISE: "Bài tập",
  WORKSPACE: "Nhóm học tập",
};

/** Cùng nhãn với nút Báo cáo bên client, kèm câu giải thích để admin biết người học đang phàn nàn điều gì. */
export const CATEGORY: Record<
  ReportCategory,
  { label: string; meaning: string }
> = {
  SPAM: {
    label: "Spam hoặc quảng cáo",
    meaning:
      "Nội dung lặp lại, quảng cáo hoặc chèn liên kết không liên quan tới việc học.",
  },
  MISLEADING: {
    label: "Thông tin sai lệch",
    meaning:
      "Kiến thức sai, gây hiểu nhầm, hoặc mô tả không đúng với nội dung thật.",
  },
  INAPPROPRIATE: {
    label: "Nội dung không phù hợp",
    meaning:
      "Ngôn từ xúc phạm, hình ảnh phản cảm hoặc không phù hợp môi trường học tập.",
  },
  COPYRIGHT: {
    label: "Vi phạm bản quyền",
    meaning:
      "Sao chép bài giảng, tài liệu hoặc mã nguồn của người khác khi chưa được phép.",
  },
  OTHER: {
    label: "Lý do khác",
    meaning: "Không thuộc nhóm nào ở trên — đọc mô tả của người báo cáo.",
  },
};

export const ROLE: Record<string, string> = {
  learner: "Học viên",
  lecturer: "Giảng viên",
  admin: "Quản trị viên",
};
export const ACCOUNT_STATUS: Record<string, string> = {
  active: "Đang hoạt động",
  suspended: "Đang bị khoá",
  deleted: "Đã xoá",
};

/** Mức khoá tài khoản tác giả; giá trị là số ngày, "none" = không thời hạn. */
export const SUSPENSION_OPTIONS = [
  { value: "1", label: "Khoá 1 ngày" },
  { value: "3", label: "Khoá 3 ngày" },
  { value: "7", label: "Khoá 7 ngày" },
  { value: "30", label: "Khoá 30 ngày" },
  { value: "none", label: "Khoá không thời hạn (tới khi mở thủ công)" },
];

/**
 * Đường dẫn bên app học viên nơi nội dung bị báo cáo hiển thị — tài liệu nhóm mở về nhóm chứa
 * nó. Chỉ trả path: `/api/auth/client-handoff` ghép origin của client và đăng nhập sẵn cho admin.
 */
export function reportedContentPath(
  report: Pick<AdminContentReport, "targetType" | "targetId" | "targetRef" | "targetSlug">,
): string | null {
  const slug = report.targetSlug ?? report.targetRef;
  switch (report.targetType) {
    case "COURSE":
      return `/courses/${report.targetId}`;
    case "ROADMAP":
      return `/roadmaps/${report.targetId}`;
    case "EXERCISE":
      return `/solve/${report.targetId}`;
    case "POST":
      return `/articles/${encodeURIComponent(slug ?? report.targetId)}`;
    case "WORKSPACE":
      return report.targetSlug ? `/workspace/${encodeURIComponent(report.targetSlug)}` : null;
    case "DOCUMENT":
      return report.targetSlug ? `/workspace/${encodeURIComponent(report.targetSlug)}?tab=documents` : null;
  }
}
