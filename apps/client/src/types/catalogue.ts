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
  shortDescription: string | null;
  coverImageUrl: string | null;
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
  description: string | null;
  coverImageUrl: string | null;
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

export interface RoadmapEnrollment {
  id: string;
  userId: string;
  roadmapId: string;
  status: "active" | "completed" | "paused" | "dropped";
  completedCourses: number;
  progressPercent: number;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string | null;
}

export interface EnrolledRoadmap extends RoadmapEnrollment {
  title: string;
  slug: string;
  field: string;
  level: string;
  coverImageUrl: string | null;
  estimatedHours: number | null;
  totalCourses: number;
}

export interface RoadmapProgress {
  enrollment: RoadmapEnrollment | null;
  courses: Array<{
    roadmapCourseId: string;
    courseId: string;
    position: number;
    isOptional: boolean;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    durationHours: number | null;
    enrollmentStatus: "active" | "completed" | "paused" | "dropped" | null;
    progressPercent: number;
    isAvailable: boolean;
  }>;
}

export interface CourseLesson {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
  /**
   * "Cho học trước": bài mở cho MỌI người kể cả chưa ghi danh khóa học, và không cần bài/
   * chương liền trước hoàn thành. Xem `explainLock` ở `lib/lesson-unlock.ts` cho luật gác
   * cửa suy ra từ trường này cộng thứ tự chương/bài.
   */
  isPreview: boolean;
  isOptional: boolean;
  position: number;
  exerciseId: string | null;
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
 * This is the learner contract. The backend removes hidden cases, reference solutions and
 * custom checker source. Author/admin clients receive the full authoring contract.
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
    constraints?: string[];
    testCases: {
      order: number;
      input?: string;
      args?: unknown[];
      expected?: unknown;
      visibility: "public";
    }[];
    languages: { id: string; label: string; monaco?: string; starterCode?: string }[];
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
  coverImageUrl: string | null;
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
  coverImageUrl: string | null;
  readMinutes: number | null;
  authorName: string | null;
  tagName: string | null;
  publishedAt: string | null;
}
