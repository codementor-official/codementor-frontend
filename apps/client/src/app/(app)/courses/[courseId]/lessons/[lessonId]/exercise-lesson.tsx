"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Code2, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ExerciseDetail, LessonProgress } from "@/types/catalogue";
import type { FlatLesson } from "./lesson-shell";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};

/**
 * A code lesson inside a course: metadata and the statement, then a button that opens the
 * solve workspace in a new tab.
 *
 * New tab rather than navigation, because the workspace is a different kind of screen — an
 * editor with its own panes and its own unsaved state. Replacing the course page with it
 * would lose the learner's place in the chapter, and coming back would mean re-finding it.
 */
export function ExerciseLesson({
  lesson,
  courseId,
  progress,
  enrolled,
}: {
  lesson: FlatLesson;
  /** Dựng đường tới trang làm bài từ route thay vì `window.location`, thứ không tồn tại khi render ở server. */
  courseId: string;
  progress: LessonProgress | undefined;
  enrolled: boolean;
}) {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = progress?.status === "completed";

  // `courseId`/`lessonId` đi kèm để trang làm bài gửi chúng cho judge. Thiếu chúng thì bài
  // nộp là luyện tập tự do và không ghi tiến độ vào đâu cả — đó cũng là hành vi đúng khi
  // vào thẳng /solve từ /practice.
  const solveHref =
    `/solve/${lesson.exerciseId}` +
    `?returnTo=${encodeURIComponent(`/courses/${courseId}/lessons/${lesson.id}`)}` +
    `&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lesson.id)}`;

  useEffect(() => {
    if (!lesson.exerciseId) return;
    let cancelled = false;
    api.exercises
      .detail(lesson.exerciseId)
      .then((data) => !cancelled && setExercise(data))
      .catch((cause: unknown) =>
        !cancelled && setError(cause instanceof Error ? cause.message : "Không tải được bài tập"),
      );
    return () => {
      cancelled = true;
    };
  }, [lesson.exerciseId]);

  if (!lesson.exerciseId) {
    return (
      <Card className="border-dashed p-8 text-center">
        <p className="text-sm font-semibold text-navy">Bài này chưa gắn bài code</p>
        <p className="mt-1 text-xs text-text-faint">Giảng viên chưa chọn bài tập cho nội dung này.</p>
      </Card>
    );
  }

  return (
    <>
      <div>
        <p className="mb-1 text-2xs font-bold tracking-wide text-text-faint uppercase">
          {lesson.chapterTitle}
        </p>
        <h1 className="text-2xl font-bold text-navy">{lesson.title}</h1>

        {error ? (
          <Card className="mt-4 border-dashed p-6 text-center">
            <p className="text-sm font-semibold text-navy">Không tải được bài tập</p>
            <p className="mt-1 text-xs text-text-muted">{error}</p>
          </Card>
        ) : !exercise ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài tập...
          </div>
        ) : (
          <>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-y border-border py-2.5">
              <div className="flex items-baseline gap-2">
                <dt className="text-xs text-text-muted">Độ khó</dt>
                <dd className="text-sm font-bold text-navy">
                  {DIFFICULTY_LABEL[exercise.difficulty] ?? exercise.difficulty}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-xs text-text-muted">Giới hạn</dt>
                <dd className="text-sm font-bold text-navy">{exercise.timeLimitMs} ms</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-xs text-text-muted">Bộ nhớ</dt>
                <dd className="text-sm font-bold text-navy">
                  {Math.round(exercise.memoryLimitKb / 1024)} MB
                </dd>
              </div>
              {exercise.content?.languages?.length ? (
                <div className="flex items-baseline gap-2">
                  <dt className="text-xs text-text-muted">Ngôn ngữ</dt>
                  <dd className="text-sm font-bold text-navy">
                    {exercise.content.languages.map((language) => language.label).join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>

            <h2 className="mt-5 mb-2 text-sm font-bold text-navy">Đề bài</h2>
            <article className="rich-text">
              <ReactMarkdown>{exercise.content?.statement ?? "_Chưa có đề bài._"}</ReactMarkdown>
            </article>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <a
          href={solveHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-on-ink transition-colors hover:bg-primary-hover"
        >
          <Code2 className="h-3.5 w-3.5" /> Làm bài
          <ExternalLink className="h-3 w-3" />
        </a>

        {enrolled && done && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-tint px-3 py-2 text-xs font-semibold text-primary">
            <Check className="h-3.5 w-3.5" /> Đã hoàn thành
          </span>
        )}
      </div>

      {enrolled && !done && (
        // Không còn nút tự đánh dấu: bài code hoàn thành khi judge chấm ĐẠT, không phải khi
        // người học nói là xong. Trang làm bài gửi kèm khóa học và bài học, judge phát
        // `evt.exercise.solved.v1`, learning-service ghi tiến độ. Nói rõ cơ chế ở đây vì nó
        // chạy bất đồng bộ — nộp xong quay lại tab này phải tải lại mới thấy đổi.
        <p className="mt-2 max-w-prose text-2xs leading-relaxed text-text-faint">
          Bài này được đánh dấu hoàn thành khi bạn nộp và tất cả test case đều đạt. Nộp xong,
          tải lại trang để thấy tiến độ cập nhật.
        </p>
      )}
    </>
  );
}
