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

export interface RoadmapListItem {
  id: string;
  slug: string;
  title: string;
  field: Field;
  level: Level;
  status: ContentStatus;
  estimatedHours: number | null;
  courseCount: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export interface RoadmapCourseItem {
  courseId: string;
  position: number;
  isOptional: boolean;
  title: string;
  slug: string;
  status: ContentStatus;
  durationHours: number | null;
}

export interface Roadmap {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  field: Field;
  level: Level;
  coverImageUrl: string | null;
  estimatedHours: number | null;
  progressionMode: ProgressionMode;
  prerequisiteNote: string | null;
  status: ContentStatus;
  createdBy: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  updatedAt: string;
  courses?: RoadmapCourseItem[];
}
