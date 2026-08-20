/**
 * Từ vựng dùng chung (lĩnh vực, cấp độ, trạng thái nội dung) đã chuyển sang
 * `@codementor/types` để màn quản trị và màn giảng viên đọc CÙNG một bảng nhãn.
 * Xuất lại ở đây nên các file trong app không phải đổi đường import.
 */
export {
  FIELDS,
  LEVELS,
  MODES,
  CONTENT_STATUSES,
  FIELD_LABELS,
  LEVEL_LABELS,
  MODE_LABELS,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
} from "@codementor/types";
export type { Field, Level, ProgressionMode, ContentStatus } from "@codementor/types";
import type { ContentStatus, Field, Level, ProgressionMode } from "@codementor/types";

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
  removalRequested: boolean;
  publishedAt: string | null;
  updatedAt: string;
  courses?: RoadmapCourseItem[];
}
