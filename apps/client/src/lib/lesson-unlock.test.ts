/**
 * Self-check for lesson gating. No test runner in this repository yet, so this is runnable
 * directly:
 *
 *   pnpm --filter @codementor/client exec tsx src/lib/lesson-unlock.test.ts
 *
 * Move it to whatever runner lands first; the assertions carry over unchanged.
 */
import assert from "node:assert/strict";
import { isLessonLocked, missingRequiredLessons } from "./lesson-unlock";
import type { CourseDetail, CourseLesson, LessonProgress } from "@/types/catalogue";

const lesson = (overrides: Partial<CourseLesson> & Pick<CourseLesson, "id" | "position">): CourseLesson => ({
  title: overrides.id,
  type: "article",
  durationMinutes: null,
  isPreview: false,
  isOptional: false,
  exerciseId: null,
  ...overrides,
});

const course: CourseDetail = {
  id: "course-1",
  slug: "course-1",
  title: "Course",
  level: "basic",
  status: "published",
  durationHours: null,
  totalChapters: 2,
  totalLessons: 3,
  createdBy: null,
  authorName: null,
  topics: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
  description: null,
  coverImageUrl: null,
  prerequisiteNote: null,
  progressionMode: "linear",
  instructorId: null,
  publishedAt: null,
  chapters: [
    {
      id: "ch-1",
      title: "Chapter 1",
      description: null,
      isOptional: false,
      position: 0,
      lessons: [
        lesson({ id: "l-1", position: 0, isPreview: true }),
        lesson({ id: "l-2", position: 1 }),
      ],
    },
    {
      id: "ch-2",
      title: "Chapter 2 (optional)",
      description: null,
      isOptional: true,
      position: 1,
      lessons: [lesson({ id: "l-3", position: 0 })],
    },
  ],
};

const progress = (entries: Record<string, LessonProgress["status"]>): Map<string, LessonProgress> =>
  new Map(
    Object.entries(entries).map(([lessonId, status]) => [
      lessonId,
      {
        lessonId,
        status,
        timeSpentSeconds: 0,
        lastPositionSeconds: null,
        startedAt: null,
        completedAt: null,
        isAvailable: true,
      },
    ]),
  );

// Not enrolled: only the preview lesson is open, regardless of what the server's
// `isAvailable` says — this is the bug fix. Stale data used to leave `isAvailable: true` on
// non-preview lessons for unenrolled learners.
assert.equal(isLessonLocked(course.chapters[0].lessons[0], { isAvailable: true }, false), false);
assert.equal(isLessonLocked(course.chapters[0].lessons[1], { isAvailable: true }, false), true);
assert.equal(isLessonLocked(course.chapters[0].lessons[1], undefined, false), true);

// Enrolled: trust the server's `isAvailable` outright.
assert.equal(isLessonLocked(course.chapters[0].lessons[1], { isAvailable: true }, true), false);
assert.equal(isLessonLocked(course.chapters[0].lessons[1], { isAvailable: false }, true), true);

// Required-lesson check for "Hoàn thành khóa học": chapter 2 is optional, so its lesson
// never blocks completion even when untouched.
assert.deepEqual(
  missingRequiredLessons(course, progress({ "l-1": "completed" })).map((item) => item.id),
  ["l-2"],
);
assert.deepEqual(
  missingRequiredLessons(course, progress({ "l-1": "completed", "l-2": "completed" })),
  [],
);

console.log("lesson-unlock: all assertions passed");
