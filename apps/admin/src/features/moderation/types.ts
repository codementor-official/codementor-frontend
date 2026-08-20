import { BookOpen, Braces, Newspaper, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Bốn loại nội dung đi qua cùng một vòng duyệt, và bốn service khác nhau sở hữu chúng.
 *
 * Bài viết trước đây không có mặt ở hàng chờ này — nó chỉ duyệt được từ trang Bài viết —
 * nên một quản trị viên mở "Hàng chờ duyệt" ra vẫn có thể bỏ sót bài đang chờ. Hàng chờ
 * phải là chỗ DUY NHẤT cần mở, nếu không thì nó không phải hàng chờ.
 */
export type ContentKind = "articles" | "exercises" | "courses" | "roadmaps";

export const CONTENT_KINDS: ContentKind[] = ["articles", "courses", "roadmaps", "exercises"];

interface KindMeta {
  label: string;
  icon: LucideIcon;
  /** Đường đọc hàng chờ. Bài viết nằm dưới `/manage` vì đó là không gian soạn thảo. */
  queuePath: string;
  /** Đường đọc chi tiết, dùng để dựng bản xem trước trước khi duyệt. */
  detailPath: (id: string) => string;
  moderatePath: (id: string) => string;
  /** Admin từ chối yêu cầu xin gỡ của tác giả — nội dung vẫn giữ nguyên `published`. */
  denyRemovalPath: (id: string) => string;
}

export const KINDS: Record<ContentKind, KindMeta> = {
  articles: {
    label: "Bài viết",
    icon: Newspaper,
    queuePath: "/articles/manage/moderation",
    detailPath: (id) => `/articles/manage/${id}`,
    moderatePath: (id) => `/articles/${id}/moderate`,
    denyRemovalPath: (id) => `/articles/${id}/deny-removal`,
  },
  courses: {
    label: "Khoá học",
    icon: BookOpen,
    queuePath: "/courses/moderation",
    detailPath: (id) => `/courses/${id}`,
    moderatePath: (id) => `/courses/${id}/moderate`,
    denyRemovalPath: (id) => `/courses/${id}/deny-removal`,
  },
  roadmaps: {
    label: "Lộ trình",
    icon: Route,
    queuePath: "/roadmaps/moderation",
    detailPath: (id) => `/roadmaps/${id}`,
    moderatePath: (id) => `/roadmaps/${id}/moderate`,
    denyRemovalPath: (id) => `/roadmaps/${id}/deny-removal`,
  },
  exercises: {
    label: "Bài code",
    icon: Braces,
    queuePath: "/exercises/moderation",
    detailPath: (id) => `/exercises/${id}`,
    moderatePath: (id) => `/exercises/${id}/moderate`,
    denyRemovalPath: (id) => `/exercises/${id}/deny-removal`,
  },
};

/**
 * `restore` đưa nội dung đã lưu trữ về bản nháp để nó đi lại vòng duyệt — không có đường
 * nào từ lưu trữ thẳng tới công khai, và đó là chủ ý.
 *
 * `revert` là đường LÙI cho một quyết định vừa lỡ tay: đưa nội dung trở lại hàng chờ
 * (`pending_review`) để xem lại. Đi được từ `rejected`, `changes_requested` và cả
 * `published` — lỡ duyệt cũng là lỡ. Không xoá gì, và mọi lần bấm đều để lại một dòng
 * trong nhật ký kiểm toán.
 */
export type ModerationDecision =
  | "approve"
  | "request_changes"
  | "reject"
  | "archive"
  | "restore"
  | "revert";

/**
 * Ba khay của khu vực duyệt. Trước đây chỉ có khay đầu, và đó là một ngõ cụt: quyết định
 * xong là nội dung biến mất khỏi màn hình duy nhất nhìn thấy nó, nên một cú bấm nhầm
 * không có đường tìm lại.
 *
 * "Đã từ chối" gộp cả `changes_requested`: với người vận hành thì cả hai đều là "đã trả
 * lại cho tác giả", và tách làm hai khay chỉ bắt họ đoán mình đã bấm nút nào tuần trước.
 */
export const MODERATION_TRAYS = ["pending", "removal", "approved", "rejected"] as const;
export type ModerationTray = (typeof MODERATION_TRAYS)[number];

export const TRAY_META: Record<ModerationTray, { label: string; statuses: string[] }> = {
  pending: { label: "Đang chờ", statuses: ["pending_review"] },
  /**
   * Yêu cầu xin gỡ. Nội dung vẫn `published` — chỉ khác ở cờ `removalRequested`, nên khay
   * này đọc cùng danh sách với "Đã duyệt" rồi lọc lại ở client.
   *
   * Phải có khay riêng: thông báo gửi cho admin nói "Mở hàng chờ duyệt", mà một yêu cầu
   * xin gỡ không rơi vào khay nào cả — nội dung không `pending_review`, nên bấm vào thông
   * báo sẽ dẫn tới một màn hình trống.
   */
  removal: { label: "Xin gỡ", statuses: ["published"] },
  approved: { label: "Đã duyệt", statuses: ["published"] },
  rejected: { label: "Đã từ chối", statuses: ["rejected", "changes_requested"] },
};

export interface QueueItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  authorName: string | null;
  /** `true` khi tác giả đang xin gỡ nội dung này (vẫn `published`) và chờ admin quyết. */
  removalRequested: boolean;
  /** Do màn này gắn sau khi gộp bốn hàng chờ; API không trả trường này. */
  kind: ContentKind;
}

/* --------------------------------------------------- Hình dạng bản xem trước */

/** Chỉ những trường bản xem trước thực sự đọc — không chép lại cả DTO của backend. */
export interface ArticlePreview {
  title: string;
  excerpt: string | null;
  takeaway: string | null;
  tagName: string | null;
  readMinutes: number | null;
  contentHtml: string;
  /** Lý do từ chối, yêu cầu sửa, HOẶC lý do gỡ (admin hoặc chính tác giả) — cùng một ô. */
  rejectionReason: string | null;
  /** `true` khi tác giả đang xin gỡ bài này (đang `published`) và chờ admin duyệt. */
  removalRequested: boolean;
}

export interface CoursePreview {
  title: string;
  description: string | null;
  level: string;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  rejectionReason: string | null;
  removalRequested: boolean;
  chapters?: {
    id: string;
    title: string;
    isOptional: boolean;
    lessons: {
      id: string;
      title: string;
      type: string;
      durationMinutes: number | null;
      exerciseId: string | null;
      exerciseTitle: string | null;
      exerciseStatus: string | null;
      contentRef: string | null;
    }[];
  }[];
}

/** Thân bài lý thuyết — cùng hình dạng mà `packages/editor` ghi xuống MongoDB. */
export interface LessonContentPreview {
  summary?: string;
  contentHtml?: string;
  /** Bài video. Cùng document với thân bài, nên về trong cùng một lượt đọc. */
  media?: { url: string; durationSeconds?: number };
}

export interface RoadmapPreview {
  title: string;
  shortDescription: string | null;
  description: string | null;
  field: string;
  level: string;
  estimatedHours: number | null;
  rejectionReason: string | null;
  removalRequested: boolean;
  courses?: { courseId: string; title: string; status: string; isOptional: boolean }[];
}

export interface ExercisePreview {
  title: string;
  summary: string | null;
  kind: string;
  difficulty: string;
  visibility: string;
  rejectionReason: string | null;
  removalRequested: boolean;
  content?: {
    statement?: string;
    constraints?: string[];
    examples?: { input: string; output: string; explanation?: string }[];
    testCases?: {
      order: number;
      input?: string;
      args?: unknown[];
      expected?: unknown;
      visibility: "public" | "hidden";
    }[];
    /**
     * `label` là tên hiển thị ("Python"); `id` là khoá kỹ thuật ("python") dùng khi chấm bài.
     * `referenceSolution` chính là lời giải mẫu giảng viên viết trong Studio — admin đọc
     * đúng thứ được chấm, không phải suy từ đề bài.
     */
    languages?: { id: string; label: string; referenceSolution?: string }[];
  } | null;
}
