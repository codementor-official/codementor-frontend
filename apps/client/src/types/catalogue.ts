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
    testCases: { order: number; input: string; expected: string; visibility: "public" | "hidden" }[];
    languages: { id: string; label: string; referenceSolution?: string }[];
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
