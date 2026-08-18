import { CheckCheck, PencilLine, RotateCcw, XCircle, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContentKind, ModerationDecision } from "@/lib/api";

export const KIND_LABELS: Record<ContentKind, string> = {
  exercises: "Bài code",
  courses: "Khóa học",
  roadmaps: "Lộ trình",
};

/** Đường tới màn quản lý của từng loại. Trang xem chi tiết là `${route}/${id}`. */
export const KIND_ROUTES: Record<ContentKind, string> = {
  exercises: "/moderation/exercises",
  courses: "/moderation/courses",
  roadmaps: "/moderation/roadmaps",
};

export interface DecisionMeta {
  label: string;
  /** Câu nói rõ hậu quả, hiện ngay cạnh nút — quyết định kiểm duyệt thấy được ở đâu khác. */
  hint: string;
  requiresReason: boolean;
  /** Bấm nhầm là nội dung đang chạy biến mất khỏi trang học viên, nên hỏi lại một lần. */
  confirm: boolean;
  variant: "default" | "outline" | "ghost" | "danger";
  icon: LucideIcon;
}

export const DECISIONS: Record<ModerationDecision, DecisionMeta> = {
  approve: {
    label: "Duyệt",
    hint: "Công khai ngay cho người học.",
    requiresReason: false,
    confirm: false,
    variant: "default",
    icon: CheckCheck,
  },
  request_changes: {
    label: "Yêu cầu sửa",
    hint: "Trả về cho tác giả sửa rồi gửi lại.",
    requiresReason: true,
    confirm: false,
    variant: "outline",
    icon: PencilLine,
  },
  reject: {
    label: "Từ chối",
    hint: "Đóng lượt gửi này. Duyệt lại được sau nếu đổi ý.",
    requiresReason: true,
    confirm: false,
    variant: "ghost",
    icon: XCircle,
  },
  archive: {
    label: "Gỡ khỏi công khai",
    hint: "Người học mất quyền xem ngay lập tức.",
    requiresReason: true,
    confirm: true,
    variant: "danger",
    icon: EyeOff,
  },
  restore: {
    label: "Khôi phục về nháp",
    hint: "Trả về cho tác giả, đi lại vòng duyệt từ đầu.",
    requiresReason: false,
    confirm: false,
    variant: "outline",
    icon: RotateCcw,
  },
};

/**
 * Việc admin làm được với một nội dung, theo trạng thái nó đang ở.
 *
 * Đây là bản sao ở giao diện của máy trạng thái trong `Exercise.moderate` /
 * `Course.moderate` / `Roadmap.moderate`. Nó không thay backend kiểm — backend vẫn trả
 * 422 nếu sai — mà để admin không phải bấm mới biết việc nào còn làm được.
 *
 * Hai đường lùi nằm ở đây:
 *   published → archive   (lỡ duyệt thì gỡ xuống, kèm lý do cho tác giả)
 *   rejected  → approve   (từ chối rồi nghĩ lại thì duyệt thẳng, không cần tác giả gửi lại)
 */
export const DECISIONS_FOR: Record<string, ModerationDecision[]> = {
  pending_review: ["approve", "request_changes", "reject"],
  changes_requested: ["approve"],
  rejected: ["approve"],
  published: ["archive"],
  archived: ["restore"],
  draft: [],
};

/** Tab trạng thái của màn quản lý từng loại. Thứ tự theo vòng đời, không theo bảng chữ cái. */
export const STATUS_TABS = [
  { value: "pending_review", label: "Chờ duyệt" },
  { value: "published", label: "Đã công khai" },
  { value: "changes_requested", label: "Cần sửa" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "archived", label: "Đã gỡ" },
] as const;

export const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Số ngày một nội dung đã nằm chờ. Chờ lâu là tín hiệu vận hành, không phải trang trí. */
export function daysWaiting(updatedAt: string): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
}
