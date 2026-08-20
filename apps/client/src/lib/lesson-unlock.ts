import type { CourseDetail, CourseLesson, LessonProgress } from "@/types/catalogue";

/**
 * Vì sao một bài đang khoá — chỉ để GIẢI THÍCH, không để quyết định.
 *
 * Ai được mở bài nào là câu trả lời của `fn_lesson_available` ở CSDL, đi tới client qua
 * `LessonProgress.isAvailable`. Mọi hàm ở đây chỉ chạy SAU khi đã biết bài bị khoá, và
 * chỉ để nói ra học viên còn thiếu gì. Tính khoá/mở ở đây là dựng luật thứ hai chạy song
 * song với luật thật — hai luật đó sẽ lệch nhau vào đúng ngày ai đó sửa một bên.
 */

export interface LessonNumbering {
  id: string;
  /** "Chương 1 · Bài 2" — cách học viên nhìn thấy bài ở mục lục. */
  number: string;
  title: string;
}

/** Đánh số theo VỊ TRÍ TRONG MẢNG đã sắp xếp, không theo `position` thô. */
export function numberLessons(course: CourseDetail): Map<string, LessonNumbering> {
  const numbering = new Map<string, LessonNumbering>();
  [...course.chapters]
    .sort((a, b) => a.position - b.position)
    .forEach((chapter, chapterIndex) => {
      [...chapter.lessons]
        .sort((a, b) => a.position - b.position)
        .forEach((lesson, lessonIndex) => {
          numbering.set(lesson.id, {
            id: lesson.id,
            number: `Chương ${chapterIndex + 1} · Bài ${lessonIndex + 1}`,
            title: lesson.title,
          });
        });
    });
  return numbering;
}

export interface LockReason {
  rule: "ALL" | "ANY";
  /** Bài học viên còn phải hoàn thành, đã đánh số. Rỗng khi không suy ra được lý do. */
  missing: LessonNumbering[];
  /** Tổng số bài trong điều kiện — với luật ANY thì "1 trong N" cần biết N. */
  total: number;
}

/**
 * Lý do một bài đang khoá, hoặc `null` khi không nói được gì cụ thể.
 *
 * `null` là câu trả lời đúng chứ không phải thiếu sót, và nó xảy ra thật ở hai trường
 * hợp: khóa học chạy chế độ `linear` (gác bằng thứ tự, không có cạnh nào để kể tên), và
 * khóa học lưu trước khi có tính năng này (không có trường `prerequisites`). Nơi gọi phải
 * có sẵn một câu chung cho cả hai.
 */
export function explainLock(
  course: CourseDetail,
  lesson: CourseLesson,
  progressByLesson: Map<string, LessonProgress>,
): LockReason | null {
  const required = lesson.prerequisites?.lessonIds ?? [];
  if (required.length === 0) return null;

  const numbering = numberLessons(course);
  const missing = required
    .filter((id) => progressByLesson.get(id)?.status !== "completed")
    .map((id) => numbering.get(id))
    .filter((entry): entry is LessonNumbering => entry !== undefined);

  if (missing.length === 0) return null;
  return { rule: lesson.prerequisites?.rule ?? "ALL", missing, total: required.length };
}

/** Một câu hoàn chỉnh cho `LockReason`, dùng chung ở mục lục và ở trang bài học. */
export function describeLock(reason: LockReason | null): string {
  if (reason === null) return "Hoàn thành các bài trước đó trong khóa học để mở bài này.";
  if (reason.rule === "ANY") {
    return `Hoàn thành ít nhất 1 trong ${reason.total} bài sau để mở bài này:`;
  }
  return "Hoàn thành tất cả các bài sau để mở bài này:";
}
