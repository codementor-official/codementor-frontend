"use client";

import { useEffect, useState } from "react";
import { BookText, ChevronDown, ChevronRight, Braces, Clock, Eye } from "lucide-react";
import { StatusBadge } from "@codementor/ui";
import { STATUS_LABELS, STATUS_TONES, type ExerciseStatus } from "@codementor/solve";
import { LESSON_TYPE_LABELS, LEVEL_LABELS, MODE_LABELS, type LessonType, type Level, type ProgressionMode } from "@codementor/types";
import { useAdminApi } from "@/features/auth/admin-api";
import { PreviewShell, ReviewChecklist } from "@/features/moderation/preview-shell";
import { describeError } from "@/features/moderation/use-moderation";
import {
  moderationApi,
  type CourseDetail,
  type CurriculumLesson,
  type LessonContent,
} from "@/lib/api";

/**
 * Khóa học như admin cần đọc nó trước khi duyệt.
 *
 * Ba tầng, đúng thứ tự người ta thực sự kiểm: mô tả và ảnh bìa (thứ học viên thấy đầu
 * tiên), cây chương trình (chương rỗng, bài rỗng), rồi thân từng bài — thân bài nằm ở
 * MongoDB nên chỉ tải khi bấm mở, không tải sẵn cả khóa học.
 */
export function CoursePreview({ id }: { id: string }) {
  const request = useAdminApi();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    moderationApi
      .course(request, id)
      .then((loaded) => {
        if (!cancelled) setCourse(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describeError(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, request]);

  if (error) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!course) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  const chapters = course.chapters ?? [];
  const lessons = chapters.flatMap((chapter) => chapter.lessons);
  const emptyChapters = chapters.filter((chapter) => chapter.lessons.length === 0);
  const lessonsWithoutContent = lessons.filter(
    (lesson) => lesson.exerciseId === null && lesson.contentRef === null,
  );
  const unusableExercises = lessons.filter(
    (lesson) => lesson.exerciseId !== null && lesson.exerciseStatus !== "published",
  );

  return (
    <PreviewShell
      id={course.id}
      kind="courses"
      rejectionReason={course.rejectionReason}
      status={course.status}
      subtitle={`${course.slug} · ${LEVEL_LABELS[course.level as Level] ?? course.level}${
        course.durationHours ? ` · ${course.durationHours} giờ` : ""
      }`}
      title={course.title}
    >
      <ReviewChecklist
        items={[
          { ok: Boolean(course.description?.trim()), text: "Có mô tả khóa học" },
          { ok: Boolean(course.coverImageUrl), text: "Có ảnh bìa" },
          { ok: chapters.length > 0, text: `Có chương (${chapters.length})` },
          {
            ok: emptyChapters.length === 0,
            text:
              emptyChapters.length === 0
                ? "Không có chương rỗng"
                : `${emptyChapters.length} chương không có bài nào`,
          },
          {
            ok: lessonsWithoutContent.length === 0,
            text:
              lessonsWithoutContent.length === 0
                ? "Mọi bài lý thuyết đều có nội dung"
                : `${lessonsWithoutContent.length} bài lý thuyết chưa có nội dung`,
          },
          {
            ok: unusableExercises.length === 0,
            // Đây là lỗi tốn kém nhất: khóa học duyệt xong vẫn hở, và chỗ hở chỉ lộ ra khi
            // một học viên mở đúng bài đó.
            text:
              unusableExercises.length === 0
                ? "Mọi bài code được nhúng đều đã công khai"
                : `${unusableExercises.length} bài code nhúng chưa công khai — học viên sẽ gặp bài trống`,
          },
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Thông tin chung</h2>
        {course.coverImageUrl && (
          // Ảnh bìa do tác giả dán URL vào, nên nó có thể hỏng hoặc trỏ sai — hiện ra để
          // thấy đúng thứ học viên sẽ thấy. `<img>` chứ không `next/image`: máy chủ ảnh là
          // tuỳ ý, và một domain chưa khai báo sẽ làm `next/image` ném lỗi thay vì hiện ảnh.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Ảnh bìa khóa học"
            className="mb-3 max-h-48 w-full rounded-md border border-border object-cover"
            src={course.coverImageUrl}
          />
        )}
        <dl className="grid gap-2 text-sm">
          <Row label="Mô tả">{course.description || "— chưa có —"}</Row>
          <Row label="Điều kiện">{course.prerequisiteNote || "—"}</Row>
          <Row label="Lối đi">
            {MODE_LABELS[course.progressionMode as ProgressionMode] ?? course.progressionMode}
          </Row>
          <Row label="Quy mô">
            {course.totalChapters} chương · {course.totalLessons} bài
          </Row>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Chương trình học</h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Khóa học chưa có chương nào.</p>
        ) : (
          <ol className="grid gap-3">
            {chapters.map((chapter, index) => (
              <li key={chapter.id}>
                <p className="text-sm font-medium">
                  {index + 1}. {chapter.title}
                  {chapter.isOptional && (
                    <span className="ml-2 text-xs text-muted-foreground">(tuỳ chọn)</span>
                  )}
                </p>
                {chapter.lessons.length === 0 ? (
                  <p className="mt-1 pl-5 text-xs text-warning">Chương này chưa có bài nào.</p>
                ) : (
                  <ul className="mt-1.5 grid gap-1.5 pl-5">
                    {chapter.lessons.map((lesson) => (
                      <LessonRow courseId={course.id} key={lesson.id} lesson={lesson} />
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </PreviewShell>
  );
}

/** Một bài học. Thân bài tải khi bấm mở — cả khóa học có thể có hàng chục bài. */
function LessonRow({ courseId, lesson }: { courseId: string; lesson: CurriculumLesson }) {
  const request = useAdminApi();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || content !== null || state === "loading" || lesson.exerciseId !== null) return;
    setState("loading");
    try {
      setContent(await moderationApi.lessonContent(request, courseId, lesson.id));
      setState("idle");
    } catch {
      setState("error");
    }
  };

  return (
    <li className="rounded-md border border-border">
      <button
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted/60"
        onClick={() => void toggle()}
        type="button"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        )}
        {lesson.exerciseId ? (
          <Braces aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <BookText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
        {lesson.isPreview && (
          <Eye aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {lesson.durationMinutes !== null && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock aria-hidden="true" className="size-3" />
            {lesson.durationMinutes}′
          </span>
        )}
        <span className="shrink-0 text-xs text-muted-foreground">
          {LESSON_TYPE_LABELS[lesson.type as LessonType] ?? lesson.type}
        </span>
        {lesson.exerciseId && (
          <StatusBadge tone={STATUS_TONES[lesson.exerciseStatus as ExerciseStatus] ?? "neutral"}>
            {STATUS_LABELS[lesson.exerciseStatus as ExerciseStatus] ?? "không rõ"}
          </StatusBadge>
        )}
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2.5 text-sm">
          {lesson.exerciseId ? (
            <p className="text-muted-foreground">
              Bài này nhúng một bài code
              {lesson.exerciseTitle ? ` — “${lesson.exerciseTitle}”` : ""}.{" "}
              <a
                className="text-foreground underline underline-offset-2"
                href={`/moderation/exercises/${lesson.exerciseId}`}
                rel="noreferrer"
                target="_blank"
              >
                Mở trang giải thử
              </a>{" "}
              để kiểm đề riêng.
            </p>
          ) : state === "loading" ? (
            <p className="text-muted-foreground">Đang tải nội dung…</p>
          ) : state === "error" ? (
            <p className="text-destructive">Không tải được nội dung bài học.</p>
          ) : content === null || (!content.contentHtml && !content.summary) ? (
            <p className="text-warning">Bài này chưa có nội dung.</p>
          ) : (
            <>
              {content.summary && <p className="mb-2 text-muted-foreground">{content.summary}</p>}
              {content.objectives && content.objectives.length > 0 && (
                <ul className="mb-2 list-disc pl-5 text-muted-foreground">
                  {content.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              )}
              {content.contentHtml && (
                // Cùng class `.rich-text` mà trình soạn thảo dùng, nên bản admin đọc và bản
                // học viên đọc là một.
                <div className="rich-text" dangerouslySetInnerHTML={{ __html: content.contentHtml }} />
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words whitespace-pre-wrap">{children}</dd>
    </div>
  );
}
