/**
 * What the backend actually returns for the three browse lists.
 *
 * These mirror the list projections in learning-service and exercise-service — not the
 * richer shapes in `types/roadmap.ts`, which describe the mock catalogue and carry fields
 * (chapters, lessons, progress, technologies) the list endpoints do not send. Keep them
 * separate: collapsing them would mean inventing values the server never returned.
 */

export type ContentStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "rejected"
  | "published"
  | "archived";

/** Cursor pagination: `nextCursor` is null on the last page. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface RoadmapSummary {
  id: string;
  slug: string;
  title: string;
  field: string;
  level: string;
  status: ContentStatus;
  estimatedHours: number | null;
  courseCount: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  level: string;
  status: ContentStatus;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export interface ExerciseSummary {
  id: string;
  slug: string;
  title: string;
  kind: string;
  difficulty: "easy" | "medium" | "hard";
  status: ContentStatus;
  visibility: string;
  authorId: string | null;
  authorName: string | null;
  forkedFromId: string | null;
  updatedAt: string;
}

/** `GET /roadmaps/:id` — the summary plus its ordered course list. */
export interface RoadmapDetail extends RoadmapSummary {
  description: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  prerequisiteNote: string | null;
  progressionMode: string;
  publishedAt: string | null;
  courses: {
    courseId: string;
    position: number;
    isOptional: boolean;
    title: string;
    slug: string;
    status: ContentStatus;
    durationHours: number | null;
  }[];
}

export interface CourseLesson {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
  isPreview: boolean;
  isOptional: boolean;
  position: number;
  exerciseId: string | null;
  /**
   * Điều kiện mở bài, để GIẢI THÍCH một ổ khoá — không phải để quyết định nó.
   *
   * Việc "bài này đã mở chưa" luôn là `LessonProgress.isAvailable`, do `fn_lesson_available`
   * trả lời ở CSDL. Đọc mảng này rồi tự tính ra khoá/mở sẽ cho ra một luật thứ hai chạy
   * song song với luật thật, và hai luật đó sẽ lệch nhau vào đúng ngày ai đó sửa một bên.
   *
   * Khoá học lưu trước khi có tính năng này không trả trường này.
   */
  prerequisites?: { rule: "ALL" | "ANY"; lessonIds: string[] };
}

/** `GET /courses/:id/lessons/:lessonId/content` — the TipTap body from MongoDB. */
export interface LessonContent {
  summary?: string;
  objectives?: string[];
  contentHtml?: string;
  exerciseBrief?: string[];
  /**
   * Video của bài, khi `lesson.type === "video"`.
   *
   * Không có trường nguồn phát: `resolveVideo` ở `@codementor/utils` nhận diện
   * YouTube/Vimeo/tệp trực tiếp từ chính URL, và studio giảng viên dùng đúng hàm đó để
   * xem trước — nên thứ giảng viên duyệt qua là thứ học viên nhận.
   */
  media?: { url: string; durationSeconds?: number; captionsUrl?: string };
}

export type ProgressStatus = "not_started" | "in_progress" | "completed";

/** `GET /courses/:id/progress` — my enrolment and my state on every lesson. */
export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  viaRoadmapId: string | null;
  status: "active" | "completed" | "paused" | "dropped";
  /** Maintained by database triggers. Read it; never try to compute or send it. */
  completedLessons: number;
  progressPercent: number;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string | null;
}

/** `GET /courses/enrollments/mine` — enrolment plus enough of the course to render a card. */
export interface EnrolledCourse extends CourseEnrollment {
  title: string;
  slug: string;
  level: string;
  coverImageUrl: string | null;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
}

export interface LessonProgress {
  lessonId: string;
  status: ProgressStatus;
  timeSpentSeconds: number;
  lastPositionSeconds: number | null;
  startedAt: string | null;
  completedAt: string | null;
  /** From `fn_lesson_available` — the same rule the write path enforces. */
  isAvailable: boolean;
}

export interface CourseProgress {
  /** `null` until the learner enrols; the lesson list still comes back. */
  enrollment: CourseEnrollment | null;
  lessons: LessonProgress[];
}

/** `GET /courses/:id` — the summary plus the whole chapter tree. */
export interface CourseDetail extends CourseSummary {
  description: string | null;
  coverImageUrl: string | null;
  prerequisiteNote: string | null;
  progressionMode: string;
  instructorId: string | null;
  publishedAt: string | null;
  chapters: {
    id: string;
    title: string;
    description: string | null;
    isOptional: boolean;
    position: number;
    lessons: CourseLesson[];
  }[];
}

/**
 * `GET /exercises/:id` — the list projection plus the body stored in MongoDB.
 *
 * `referenceSolution` is the author's answer. It is on the wire because the same endpoint
 * serves the lecturer studio, and it must never reach the learner's editor.
 *
 * `visibility: "hidden"` test cases are also on the wire, so they are not hidden from
 * anyone determined to look — the judge takes its cases from the client. Treating them as
 * hidden is a UI courtesy until grading moves behind submission-service.
 */
export interface ExerciseDetail extends ExerciseSummary {
  summary: string | null;
  xpReward: number;
  estimatedMinutes: number | null;
  timeLimitMs: number;
  memoryLimitKb: number;
  publishedAt: string | null;
  content: {
    statement: string;
    /**
     * `stdin_stdout` cases carry `input`; `function` cases carry positional `args` and an
     * `expected` of any JSON type. Both shapes reach the judge, which picks by `spec`.
     */
    ioMode?: "stdin_stdout" | "function";
    signature?: {
      functionName: string;
      parameters: { name: string; type: Record<string, unknown>; description?: string }[];
      returnType: Record<string, unknown>;
    };
    testCases: {
      order: number;
      input?: string;
      args?: unknown[];
      expected?: unknown;
      visibility: "public" | "hidden";
    }[];
    languages: { id: string; label: string; monaco?: string; starterCode?: string; referenceSolution?: string }[];
  } | null;
}

/**
 * The largest page the backend will serve. Asking for more is a 400
 * ("limit must not be greater than 100"), not a silent clamp.
 */
export const MAX_PAGE_SIZE = 100;

/** Filters the list endpoints understand. Each domain reads only the keys it knows. */
export interface CatalogueParams {
  q?: string;
  field?: string;
  level?: string;
  difficulty?: string;
  kind?: string;
  cursor?: string;
  limit?: number;
}

/** Bài viết biên tập, đúng hình dạng `ArticleView` mà learning-service trả về. */
export interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  takeaway: string | null;
  readMinutes: number | null;
  status: string;
  authorName: string | null;
  tagName: string | null;
  publishedAt: string | null;
  /** HTML từ RichTextEditor. Xem `article_contents.contentHtml`. */
  contentHtml: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readMinutes: number | null;
  authorName: string | null;
  tagName: string | null;
  publishedAt: string | null;
}
