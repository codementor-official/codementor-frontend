/**
 * Từ vựng nội dung học, khớp 1-1 với enum của backend (`current_level`, `roadmap_field`,
 * `content_status`, `lesson_type`).
 *
 * Ở package dùng chung vì cả ba ứng dụng đều hiển thị đúng những giá trị này, và ba bản
 * sao của một bảng nhãn thì bản sai không bao giờ tự lộ ra: nó chỉ hiện một nhãn khác
 * người dùng đang mong đợi, ở đúng một màn hình.
 */

export const FIELDS = ["frontend", "backend", "fullstack", "mobile", "data_ai", "foundation"] as const;
export const LEVELS = ["none", "basic", "intermediate", "experienced"] as const;
export const MODES = ["linear", "graph", "free"] as const;
export const CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "rejected",
  "published",
  "archived",
] as const;

export type Field = (typeof FIELDS)[number];
export type Level = (typeof LEVELS)[number];
export type ProgressionMode = (typeof MODES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const FIELD_LABELS: Record<Field, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",
  data_ai: "Data & AI",
  foundation: "Nền tảng",
};

export const LEVEL_LABELS: Record<Level, string> = {
  none: "Chưa có nền",
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  experienced: "Nâng cao",
};

export const MODE_LABELS: Record<ProgressionMode, string> = {
  linear: "Tuần tự — phải học đúng thứ tự",
  graph: "Theo phụ thuộc — mở khi đủ điều kiện",
  free: "Tự do — mở hết",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  changes_requested: "Cần sửa",
  rejected: "Bị từ chối",
  published: "Đã công khai",
  archived: "Đã gỡ",
};

/** StatusBadge chỉ có bốn tông, sáu trạng thái phải gom về đó. */
export const CONTENT_STATUS_TONES: Record<
  ContentStatus,
  "neutral" | "success" | "warning" | "danger"
> = {
  draft: "neutral",
  pending_review: "warning",
  changes_requested: "warning",
  rejected: "danger",
  published: "success",
  archived: "neutral",
};

export const LESSON_TYPES = ["video", "article", "exercise", "quiz", "challenge", "project"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  article: "Bài lý thuyết",
  video: "Video",
  exercise: "Bài code",
  quiz: "Trắc nghiệm",
  challenge: "Thử thách",
  project: "Dự án",
};
