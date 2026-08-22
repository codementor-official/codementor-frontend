import type { CourseDetail, CourseLesson, LessonProgress } from "@/types/catalogue";

/**
 * Vì sao một bài đang khoá — chỉ để GIẢI THÍCH, không để quyết định.
 *
 * Ai được mở bài nào là câu trả lời của `fn_lesson_available` ở CSDL, đi tới client qua
 * `LessonProgress.isAvailable`. Mọi hàm ở đây chỉ chạy SAU khi đã biết bài bị khoá, và
 * chỉ để nói ra học viên còn thiếu gì. Tính khoá/mở ở đây là dựng luật thứ hai chạy song
 * song với luật thật, và vì vậy `explainLock` cố tình suy lại đúng CÙNG một luật đơn giản
 * mà backend dùng để sinh cạnh phụ thuộc (`deriveLessonSources` ở learning-service) thay
 * vì đọc một trường điều kiện tự chọn — luật đó không còn tồn tại, khóa học giờ tuyến
 * tính mặc định và chỉ có "cho học trước" (`isPreview`) làm ngoại lệ.
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
  /** Bài học viên còn phải hoàn thành, đã đánh số. Rỗng khi không suy ra được lý do. */
  missing: LessonNumbering[];
  /** Tổng số bài phải hoàn thành — 1 (bài liền trước) hoặc cả chương trước (>1). */
  total: number;
}

/**
 * Lý do một bài đang khoá, hoặc `null` khi không nói được gì cụ thể.
 *
 * `null` xảy ra thật ở ba trường hợp: khóa học chạy chế độ `free` (không gác gì), bài
 * đang xét là bài đầu tiên của cả khóa (không có gì đứng trước), hoặc — trường hợp không
 * nên xảy ra vì khoá rồi — bài này tự nó "cho học trước". Nơi gọi phải có sẵn một câu
 * chung cho các trường hợp `null`.
 *
 * Bài N cần bài N-1 CÙNG CHƯƠNG; bài đầu một chương (trừ chương đầu) cần TOÀN BỘ bài
 * chương trước — đúng luật `deriveLessonSources` phía backend đã dùng để sinh cạnh phụ
 * thuộc lúc lưu, nên câu giải thích luôn khớp với luật thật đang gác cửa.
 */
export function explainLock(
  course: CourseDetail,
  lesson: CourseLesson,
  progressByLesson: Map<string, LessonProgress>,
): LockReason | null {
  const chapters = [...course.chapters].sort((a, b) => a.position - b.position);
  const chapterIndex = chapters.findIndex((chapter) =>
    chapter.lessons.some((item) => item.id === lesson.id),
  );
  if (chapterIndex < 0) return null;

  const lessons = [...chapters[chapterIndex].lessons].sort((a, b) => a.position - b.position);
  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);

  const required =
    lessonIndex > 0
      ? [lessons[lessonIndex - 1]]
      : chapterIndex > 0
        ? [...chapters[chapterIndex - 1].lessons].sort((a, b) => a.position - b.position)
        : [];
  if (required.length === 0) return null;

  const numbering = numberLessons(course);
  const missing = required
    .filter((item) => progressByLesson.get(item.id)?.status !== "completed")
    .map((item) => numbering.get(item.id))
    .filter((entry): entry is LessonNumbering => entry !== undefined);

  if (missing.length === 0) return null;
  return { missing, total: required.length };
}

/** Một câu hoàn chỉnh cho `LockReason`, dùng chung ở mục lục và ở trang bài học. */
export function describeLock(reason: LockReason | null): string {
  if (reason === null) return "Hoàn thành các bài trước đó trong khóa học để mở bài này.";
  return reason.total > 1
    ? "Hoàn thành tất cả các bài sau để mở bài này:"
    : "Hoàn thành bài sau để mở bài này:";
}
