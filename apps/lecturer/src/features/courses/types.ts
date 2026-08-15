import type { ContentStatus, Level } from "@/features/roadmaps/types";

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

/** Khớp CHECK `lessons_exercise_only_for_exercise_types` ở CSDL. */
const EXERCISE_BEARING: LessonType[] = ["exercise", "quiz", "challenge", "project"];

export function bearsExercise(type: LessonType): boolean {
  return EXERCISE_BEARING.includes(type);
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  level: Level;
  status: ContentStatus;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export interface StoredLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
  isPreview: boolean;
  isOptional: boolean;
  position: number;
  exerciseId: string | null;
  contentRef: string | null;
  exerciseTitle: string | null;
  exerciseStatus: string | null;
  exerciseAuthorId: string | null;
}

export interface StoredChapter {
  id: string;
  title: string;
  description: string | null;
  isOptional: boolean;
  position: number;
  lessons: StoredLesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: Level;
  durationHours: number | null;
  instructorId: string | null;
  prerequisiteNote: string | null;
  progressionMode: string;
  status: ContentStatus;
  createdBy: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  totalChapters: number;
  totalLessons: number;
  updatedAt: string;
  chapters?: StoredChapter[];
}

export interface LessonContent {
  summary?: string;
  objectives?: string[];
  contentHtml?: string;
  exerciseBrief?: string[];
}

/**
 * Cây đang soạn trong studio.
 *
 * `id` vắng mặt = mục mới, backend sinh id. Có `id` = giữ nguyên hàng, và đó là điều
 * kiện để tiến độ học viên không bị xoá — nên kéo thả tuyệt đối không được sinh id mới
 * cho một bài đã tồn tại.
 */
export interface DraftLesson {
  key: string;
  id?: string;
  title: string;
  type: LessonType;
  durationMinutes: string;
  isPreview: boolean;
  isOptional: boolean;
  exerciseId: string | null;
  exerciseTitle: string | null;
  contentRef: string | null;
}

export interface DraftChapter {
  key: string;
  id?: string;
  title: string;
  description: string;
  isOptional: boolean;
  lessons: DraftLesson[];
}

let counter = 0;
/** Khoá ổn định cho React và cho dnd-kit, kể cả khi mục chưa có id từ máy chủ. */
export function newKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toDraft(chapters: StoredChapter[]): DraftChapter[] {
  return chapters.map((chapter) => ({
    key: newKey("ch"),
    id: chapter.id,
    title: chapter.title,
    description: chapter.description ?? "",
    isOptional: chapter.isOptional,
    lessons: chapter.lessons.map((lesson) => ({
      key: newKey("ls"),
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes?.toString() ?? "",
      isPreview: lesson.isPreview,
      isOptional: lesson.isOptional,
      exerciseId: lesson.exerciseId,
      exerciseTitle: lesson.exerciseTitle,
      contentRef: lesson.contentRef,
    })),
  }));
}

export function toPayload(chapters: DraftChapter[]) {
  return chapters.map((chapter) => ({
    ...(chapter.id ? { id: chapter.id } : {}),
    title: chapter.title,
    description: chapter.description || null,
    isOptional: chapter.isOptional,
    lessons: chapter.lessons.map((lesson) => ({
      ...(lesson.id ? { id: lesson.id } : {}),
      title: lesson.title,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes.trim() ? Number(lesson.durationMinutes) : null,
      isPreview: lesson.isPreview,
      isOptional: lesson.isOptional,
      exerciseId: bearsExercise(lesson.type) ? lesson.exerciseId : null,
    })),
  }));
}
