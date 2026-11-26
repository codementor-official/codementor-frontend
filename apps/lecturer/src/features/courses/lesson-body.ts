/**
 * Thân bài đang soạn trong studio khóa học.
 *
 * Nó nằm ở state của TRANG chứ không ở panel bên phải: panel bị gỡ mỗi lần đổi bài, nên
 * giữ ở đó là mất mọi thứ vừa gõ, vừa dán hay đang tải lên.
 */
import { lessonDurationError, url } from "@codementor/utils";
import { bearsExercise, type DraftChapter, type DraftLesson, type LessonContent } from "./types";

export interface LessonBody {
  html: string;
  summary: string;
  videoUrl: string;
  /** Thời lượng video, giây. `null` = chưa đọc được — xem `lessonDurationError`. */
  videoSeconds: number | null;
}

export interface BodyDraft extends LessonBody {
  /** Có thay đổi chưa ghi lên máy chủ. */
  dirty: boolean;
}

/** Theo `DraftLesson.key`. Vắng mặt = chưa nạp và chưa sửa. */
export type BodyDrafts = Record<string, BodyDraft>;

export const EMPTY_BODY: LessonBody = { html: "", summary: "", videoUrl: "", videoSeconds: null };

export function toBody(content: LessonContent | null): LessonBody {
  return {
    html: content?.contentHtml ?? "",
    summary: content?.summary ?? "",
    videoUrl: content?.media?.url ?? "",
    videoSeconds: content?.media?.durationSeconds ?? null,
  };
}

/**
 * Bài video ghi `media`, bài lý thuyết ghi `contentHtml`. Gửi cả hai trong mọi trường hợp sẽ
 * ghi đè thân bài cũ bằng chuỗi rỗng khi người soạn đổi một bài lý thuyết sang video rồi đổi
 * ngược lại.
 */
export function toContent(type: DraftLesson["type"], body: LessonBody): LessonContent {
  const summary = body.summary || undefined;
  if (type !== "video") return { summary, contentHtml: body.html };

  const videoUrl = body.videoUrl.trim();
  if (!videoUrl) return { summary };
  return {
    summary,
    media: {
      url: videoUrl,
      // Ghi kèm để màn học viên biết đủ 80% là bao nhiêu giây mà không phải đợi SDK trả lời.
      // Thiếu thì bỏ hẳn khoá — `undefined` lọt qua `IsInt()` của DTO, còn `null` thì không.
      ...(body.videoSeconds !== null ? { durationSeconds: Math.round(body.videoSeconds) } : {}),
    },
  };
}

/** Thứ đang chặn lưu thân bài, hoặc `undefined` khi lưu được. */
export function bodyProblem(lesson: DraftLesson, body: LessonBody): string | undefined {
  const isVideo = lesson.type === "video";
  return (
    (isVideo ? url(body.videoUrl, "URL video") : undefined) ??
    (isVideo
      ? lessonDurationError(
          lesson.durationMinutes.trim() ? Number(lesson.durationMinutes) : null,
          body.videoSeconds,
        )
      : undefined) ??
    (body.summary.trim().length > 2000 ? "Tóm tắt tối đa 2000 ký tự" : undefined)
  );
}

/**
 * Gộp một thay đổi vào bản nháp. `edited = false` cho thứ máy tự đo được (thời lượng video
 * lúc xem trước): chỉ mở bài ra xem thì không được tính là còn thay đổi chưa lưu.
 */
export function patchBody(
  drafts: BodyDrafts,
  key: string,
  partial: Partial<LessonBody>,
  edited = true,
): BodyDrafts {
  const current = drafts[key] ?? { ...EMPTY_BODY, dirty: false };
  const changed = (Object.keys(partial) as (keyof LessonBody)[]).some(
    (field) => current[field] !== partial[field],
  );
  if (!changed) return drafts;
  return { ...drafts, [key]: { ...current, ...partial, dirty: edited || current.dirty } };
}

/** Bài còn thân chưa lưu, kèm vị trí trên cây. Bài đã xoá hoặc đã đổi sang bài code thì bỏ qua. */
export function unsavedLessons(chapters: DraftChapter[], drafts: BodyDrafts) {
  return chapters.flatMap((chapter, chapterIndex) =>
    chapter.lessons.flatMap((lesson, lessonIndex) => {
      const body = drafts[lesson.key];
      return body?.dirty && !bearsExercise(lesson.type)
        ? [{ chapterIndex, lessonIndex, lesson, body }]
        : [];
    }),
  );
}
