"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon as ArrowLeft, ArrowRightIcon as ArrowRight, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/ssr";
import { LESSON_TYPE_LABELS, type LessonType } from "@codementor/types";
import { Button, Card, StatusBadge } from "@codementor/ui";
import { resolveVideo } from "@codementor/utils";
import { useAdminApi } from "@/features/auth/admin-api";
import { ExerciseSummary } from "@/features/moderation/content-preview";
import type { ExercisePreview } from "@/features/moderation/types";
import { moderationApi } from "@/lib/api";

export interface ViewerLesson {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
  isPreview?: boolean;
  isOptional?: boolean;
  exerciseId: string | null;
  exerciseTitle: string | null;
  exerciseStatus: string | null;
  contentRef: string | null;
}

type LessonContent = Awaited<ReturnType<typeof moderationApi.lessonContent>>;

/** One lesson as the learner gets it: video (with captions), summary, objectives, body or exercise. */
export function LessonPane({
  courseId,
  lesson,
  chapterTitle,
  position,
  prev,
  next,
  onSelect,
}: {
  courseId: string;
  lesson: ViewerLesson;
  chapterTitle: string;
  position: string;
  prev: ViewerLesson | null;
  next: ViewerLesson | null;
  onSelect: (id: string) => void;
}) {
  const request = useAdminApi();
  const isExercise = Boolean(lesson.exerciseId) || ["exercise", "quiz", "challenge", "project"].includes(lesson.type);
  const [content, setContent] = useState<{ id: string; value: LessonContent } | null>(null);
  const [exercise, setExercise] = useState<{ id: string; value: ExercisePreview | null } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    if (isExercise) {
      if (!lesson.exerciseId) return;
      moderationApi
        .detail<ExercisePreview>(request, "exercises", lesson.exerciseId)
        .then((value) => { if (live) setExercise({ id: lesson.id, value }); })
        .catch(() => { if (live) setExercise({ id: lesson.id, value: null }); });
    } else {
      moderationApi
        .lessonContent(request, courseId, lesson.id)
        .then((value) => { if (live) setContent({ id: lesson.id, value }); })
        .catch((e) => { if (live) setError(e instanceof Error ? e.message : "Không đọc được bài học."); });
    }
    return () => { live = false; };
  }, [request, courseId, lesson.id, lesson.exerciseId, isExercise]);

  const loaded = isExercise ? exercise?.id === lesson.id || !lesson.exerciseId : content?.id === lesson.id;
  const body = content?.id === lesson.id ? content.value : null;
  const video = !isExercise ? resolveVideo(body?.media?.url) : null;

  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{chapterTitle} · Bài {position}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{lesson.title}</h2>
        <StatusBadge>{LESSON_TYPE_LABELS[lesson.type as LessonType] ?? lesson.type}</StatusBadge>
        {lesson.durationMinutes ? <span className="text-xs text-muted-foreground">{lesson.durationMinutes} phút</span> : null}
        {lesson.isPreview && <StatusBadge tone="success">Học thử</StatusBadge>}
        {lesson.isOptional && <StatusBadge tone="neutral">Tuỳ chọn</StatusBadge>}
      </div>

      <div className="mt-4 space-y-4">
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
        {!loaded && !error && (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-4 animate-spin" /> Đang tải bài học…</p>
        )}

        {loaded && isExercise && (
          !lesson.exerciseId ? (
            <p className="text-sm text-destructive">Bài học chưa gắn bài code nào.</p>
          ) : exercise?.value ? (
            <ExerciseSummary exercise={exercise.value} />
          ) : (
            <p className="text-sm text-destructive">Không đọc được bài code “{lesson.exerciseTitle ?? lesson.exerciseId}”.</p>
          )
        )}

        {loaded && !isExercise && (
          <>
            {lesson.type === "video" && !video && <p className="text-sm text-destructive">Bài video chưa có video.</p>}
            {video?.kind === "file" && (
              // Uploaded videos come back as a short-lived signed URL; captions ride on the same element.
              <video className="aspect-video w-full rounded-lg border bg-ink-fixed" controls preload="metadata" src={video.src}>
                {body?.media?.captionsUrl && <track default kind="captions" label="Phụ đề" src={body.media.captionsUrl} srcLang="vi" />}
              </video>
            )}
            {video && video.kind !== "file" && (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-lg border"
                src={video.src}
                title={lesson.title}
              />
            )}
            {body?.media?.durationSeconds ? (
              <p className="text-xs text-muted-foreground">Thời lượng video: {Math.round(body.media.durationSeconds / 60)} phút</p>
            ) : null}
            {body?.summary && (
              <section>
                <h3 className="text-sm font-semibold">Tóm tắt</h3>
                <p className="mt-1 text-sm">{body.summary}</p>
              </section>
            )}
            {body?.objectives && body.objectives.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold">Mục tiêu</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{body.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              </section>
            )}
            {body?.contentHtml ? (
              <div className="rich-text rounded-md border bg-background p-4 text-foreground" dangerouslySetInnerHTML={{ __html: body.contentHtml }} />
            ) : (
              lesson.type !== "video" && <p className="text-sm text-destructive">Bài học chưa có nội dung.</p>
            )}
            {body?.exerciseBrief && body.exerciseBrief.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold">Bài tập kèm theo</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{body.exerciseBrief.map((o) => <li key={o}>{o}</li>)}</ul>
              </section>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2 border-t pt-4">
        <Button disabled={!prev} onClick={() => prev && onSelect(prev.id)} size="sm" variant="outline">
          <ArrowLeft aria-hidden="true" className="size-4" /> Bài trước
        </Button>
        <Button disabled={!next} onClick={() => next && onSelect(next.id)} size="sm" variant="outline">
          Bài sau <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
