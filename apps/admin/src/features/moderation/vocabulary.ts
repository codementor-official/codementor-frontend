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
  /** Câu tóm tắt hậu quả, hiện khi rê chuột lên nút. */
  hint: string;
  /** Có hỏi lại bằng hộp thoại không. Việc nào để lại dấu vết cho tác giả thì có. */
  asks: boolean;
  /** Tiêu đề hộp thoại — một câu hỏi, để đọc xong biết mình đang xác nhận gì. */
  question: string;
  /** Chuyện gì xảy ra ngay sau khi xác nhận. */
  consequence: string;
  requiresReason: boolean;
  /** Câu báo sau khi xong, đi bằng toast. */
  done: string;
  variant: "default" | "outline" | "ghost" | "danger";
  icon: LucideIcon;
}

export const DECISIONS: Record<ModerationDecision, DecisionMeta> = {
  approve: {
    label: "Duyệt",
    hint: "Công khai ngay cho người học.",
    asks: false,
    question: "Duyệt nội dung này?",
    consequence: "Nội dung sẽ hiện với người học ngay lập tức.",
    requiresReason: false,
    done: "Đã duyệt",
    variant: "default",
    icon: CheckCheck,
  },
  request_changes: {
    label: "Yêu cầu sửa",
    hint: "Trả về cho tác giả sửa rồi gửi lại.",
    asks: true,
    question: "Trả lại cho tác giả sửa?",
    consequence:
      "Nội dung rời hàng chờ và về lại tay tác giả. Họ sửa xong sẽ gửi duyệt lần nữa.",
    requiresReason: true,
    done: "Đã trả lại cho tác giả sửa",
    variant: "outline",
    icon: PencilLine,
  },
  reject: {
    label: "Từ chối",
    hint: "Đóng lượt gửi này. Duyệt lại được sau nếu đổi ý.",
    asks: true,
    question: "Từ chối nội dung này?",
    consequence:
      "Lượt gửi này đóng lại và tác giả đọc được lý do. Nếu sau đó nghĩ lại, bạn vẫn duyệt thẳng được từ tab “Đã từ chối”.",
    requiresReason: true,
    done: "Đã từ chối",
    variant: "ghost",
    icon: XCircle,
  },
  archive: {
    label: "Gỡ khỏi công khai",
    hint: "Người học mất quyền xem ngay lập tức.",
    asks: true,
    question: "Gỡ nội dung này khỏi công khai?",
    consequence:
      "Người học mất quyền xem ngay lập tức. Nội dung chuyển sang “Đã gỡ”; khôi phục được nhưng phải đi lại vòng duyệt từ bản nháp.",
    requiresReason: true,
    done: "Đã gỡ khỏi công khai",
    variant: "danger",
    icon: EyeOff,
  },
  restore: {
    label: "Khôi phục về nháp",
    hint: "Trả về cho tác giả, đi lại vòng duyệt từ đầu.",
    asks: false,
    question: "Khôi phục nội dung đã gỡ?",
    consequence: "Nội dung về lại bản nháp của tác giả và phải gửi duyệt lại mới công khai.",
    requiresReason: false,
    done: "Đã khôi phục về nháp",
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
