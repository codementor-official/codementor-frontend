import type { CurrentLevel } from "@/types/learning-preference";

export type RoadmapField =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "data-ai"
  | "foundation";

export type LessonType = "video" | "article" | "exercise" | "quiz" | "challenge" | "project";

export type CourseStatus = "not-started" | "in-progress" | "completed" | "locked";

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  isPreview: boolean;
  isLocked: boolean;
  isCompleted: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  level: CurrentLevel;
  durationHours: number;
  technologies: string[];
  prerequisites: string[];
  outcomes: string[];
  /** Authoritative counts — kept separate from `chapters` so a course can report
   * realistic totals before its full curriculum has been authored. */
  totalChapters: number;
  totalLessons: number;
  /** Full chapter/lesson breakdown. Empty for courses whose curriculum hasn't
   * been fleshed out yet — render an "đang biên soạn" empty state for those. */
  chapters: Chapter[];
  status: CourseStatus;
  progressPercent: number;
  /** Udemy-style detail-page metadata — optional because it's only authored for a
   * handful of demo courses so far, not the whole catalog. */
  instructor?: string;
  rating?: number;
  ratingCount?: number;
  studentCount?: number;
}

export interface RoadmapProgress {
  completedCourses: number;
  totalCourses: number;
  percent: number;
}

export interface LearningRoadmap {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  shortDescription: string;
  description: string;
  field: RoadmapField;
  level: CurrentLevel;
  technologies: string[];
  estimatedHours: number;
  prerequisites: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  courses: Course[];
  /** Sort signal for the "Lộ trình phổ biến" section — arbitrary 0-100 scale. */
  popularity: number;
  updatedAt: string;
  userProgress: RoadmapProgress | null;
}

export interface RecommendationResult {
  roadmapId: string;
  score: number;
  matchedReasons: string[];
}

export type RankedRoadmap = LearningRoadmap & RecommendationResult;
