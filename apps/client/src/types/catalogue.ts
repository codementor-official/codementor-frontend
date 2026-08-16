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
