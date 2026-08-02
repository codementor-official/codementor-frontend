import type { CurrentLevel } from "@/types/learning-preference";
import type { Chapter, Course, LessonType } from "@/types/roadmap";

export const LEVEL_DISPLAY_LABEL: Record<CurrentLevel, string> = {
  none: "Mới bắt đầu",
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  experienced: "Nâng cao",
};

export function getChapterDurationMinutes(chapter: Chapter): number {
  return chapter.lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}g${rest}p` : `${hours} giờ`;
}

export function formatEstimatedHours(hours: number): string {
  const months = Math.max(1, Math.round(hours / 20));
  return `${hours} giờ · ~${months} tháng`;
}

/** Lesson-type breakdown for a course — drives the Udemy-style "khóa học này bao gồm"
 * list without needing separate mock counters that could drift from the real curriculum. */
export function getLessonTypeCounts(course: Course): Record<LessonType, number> {
  const counts: Record<LessonType, number> = { video: 0, article: 0, exercise: 0, quiz: 0, challenge: 0, project: 0 };
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) counts[lesson.type] += 1;
  }
  return counts;
}
