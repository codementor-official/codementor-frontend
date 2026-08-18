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
}

export const KINDS: Record<ContentKind, KindMeta> = {
  articles: {
    label: "Bài viết",
    icon: Newspaper,
    queuePath: "/articles/manage/moderation",
    detailPath: (id) => `/articles/manage/${id}`,
    moderatePath: (id) => `/articles/${id}/moderate`,
  },
  courses: {
    label: "Khoá học",
    icon: BookOpen,
    queuePath: "/courses/moderation",
    detailPath: (id) => `/courses/${id}`,
    moderatePath: (id) => `/courses/${id}/moderate`,
  },
  roadmaps: {
    label: "Lộ trình",
    icon: Route,
    queuePath: "/roadmaps/moderation",
    detailPath: (id) => `/roadmaps/${id}`,
    moderatePath: (id) => `/roadmaps/${id}/moderate`,
  },
  exercises: {
    label: "Bài code",
    icon: Braces,
    queuePath: "/exercises/moderation",
    detailPath: (id) => `/exercises/${id}`,
    moderatePath: (id) => `/exercises/${id}/moderate`,
  },
};

/**
 * `restore` đưa nội dung đã lưu trữ về bản nháp để nó đi lại vòng duyệt — không có đường
 * nào từ lưu trữ thẳng tới công khai, và đó là chủ ý.
 */
export type ModerationDecision = "approve" | "request_changes" | "reject" | "archive" | "restore";

export interface QueueItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  authorName: string | null;
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
}

export interface CoursePreview {
  title: string;
  description: string | null;
  level: string;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  chapters?: {
    id: string;
    title: string;
    isOptional: boolean;
    lessons: {
      id: string;
      title: string;
      type: string;
      durationMinutes: number | null;
      exerciseTitle: string | null;
      contentRef: string | null;
    }[];
  }[];
}

export interface RoadmapPreview {
  title: string;
  shortDescription: string | null;
  description: string | null;
  field: string;
  level: string;
  estimatedHours: number | null;
  courses?: { courseId: string; title: string; status: string; isOptional: boolean }[];
}

export interface ExercisePreview {
  title: string;
  summary: string | null;
  kind: string;
  difficulty: string;
  visibility: string;
  content?: {
    statement?: string;
    constraints?: string[];
    examples?: { input: string; output: string; explanation?: string }[];
    testCases?: { visibility: string }[];
    languages?: { language: string }[];
  } | null;
}
