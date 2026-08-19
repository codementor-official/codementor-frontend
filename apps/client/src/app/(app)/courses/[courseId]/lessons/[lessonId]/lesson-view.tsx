"use client";

import { useToast } from "@codementor/ui";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { CourseDetail, CourseProgress, LessonContent, LessonProgress } from "@/types/catalogue";
import { ExerciseLesson } from "./exercise-lesson";
import { LessonShell, flattenLessons, type FlatLesson } from "./lesson-shell";
import { TheoryLesson } from "./theory-lesson";

const CODE_LESSON_TYPES = new Set(["exercise", "quiz", "challenge", "project"]);

export function LessonView({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const toast = useToast();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProgress = useCallback(async () => {
    setProgress(await api.courses.progress(courseId));
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.courses.detail(courseId), api.courses.progress(courseId)])
      .then(([courseData, progressData]) => {
        if (cancelled) return;
        setCourse(courseData);
        setProgress(progressData);
      })
      .catch((cause: unknown) =>
        !cancelled && setError(cause instanceof Error ? cause.message : "Không tải được bài học"),
      );
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // Body lives in MongoDB and only theory lessons have one; a 404 here is normal for a
  // lesson whose author has not written it yet, so it must not blank the page.
  useEffect(() => {
    let cancelled = false;
    setContent(null);
    api.courses
      .lessonContent(courseId, lessonId)
      .then((data) => !cancelled && setContent(data))
      .catch(() => !cancelled && setContent(null));
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const complete = useCallback(
    async (secondsSpent: number) => {
      setSaving(true);
      try {
        await api.courses.recordProgress(courseId, lessonId, {
          status: "completed",
          timeSpentSeconds: secondsSpent,
        });
        // Re-read rather than patch locally: finishing this lesson may have unlocked the
        // next one, and only the server knows — `isAvailable` comes from a SQL function.
        await loadProgress();
      } catch (cause) {
        // Ghi tiến độ hỏng phải nói ra — nó từng bị nuốt hoàn toàn: nhánh hiện lỗi chỉ
        // chạy khi khóa học chưa tải được, nên một lần PUT hỏng để lại trang y như cũ và
        // người học tin là đã lưu. `error` giữ cho lỗi TẢI, cái này là một thao tác.
        toast.error(
          `Không lưu được tiến độ: ${cause instanceof Error ? cause.message : "lỗi không rõ"}`,
        );
      } finally {
        setSaving(false);
      }
    },
    [courseId, lessonId, loadProgress],
  );

  if (error && !course) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-sm font-semibold text-navy">Không mở được bài học</p>
        <p className="mt-1 text-xs text-text-muted">{error}</p>
        <Link href={`/courses/${courseId}`} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          Quay lại khóa học
        </Link>
      </Card>
    );
  }

  if (!course || !progress) {
    return (
      <div className="flex items-center gap-2 p-10 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài học...
      </div>
    );
  }

  const lessons = flattenLessons(course);
  const current: FlatLesson | undefined = lessons.find((lesson) => lesson.id === lessonId);
  const progressByLesson = new Map<string, LessonProgress>(
    progress.lessons.map((lesson) => [lesson.lessonId, lesson]),
  );

  if (!current) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-sm font-semibold text-navy">Bài học không thuộc khóa học này</p>
        <Link href={`/courses/${courseId}`} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          Quay lại khóa học
        </Link>
      </Card>
    );
  }

  const currentProgress = progressByLesson.get(current.id);
  const enrolled = progress.enrollment !== null && progress.enrollment.status !== "dropped";

  // Locked is decided by the server, so honour it here too rather than rendering a body the
  // learner is not meant to see yet.
  if (currentProgress?.isAvailable === false) {
    return (
      <div>
        <BreadcrumbTitle slug={courseId} title={course.title} />
        <BreadcrumbTitle slug={lessonId} title={current.title} />
        <Card className="border-dashed p-10 text-center">
          <p className="text-sm font-semibold text-navy">Bài học chưa mở</p>
          <p className="mt-1 text-xs text-text-muted">
            Hoàn thành các bài trước đó trong khóa học để mở bài này.
          </p>
          <Link href={`/courses/${courseId}`} className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
            Xem nội dung khóa học
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <BreadcrumbTitle slug={courseId} title={course.title} />
      <BreadcrumbTitle slug={lessonId} title={current.title} />

      <LessonShell
        course={course}
        lessons={lessons}
        progressByLesson={progressByLesson}
        current={current}
        footer={null}
      >
        {CODE_LESSON_TYPES.has(current.type) ? (
          <ExerciseLesson
            lesson={current}
            courseId={courseId}
            progress={currentProgress}
            enrolled={enrolled}
          />
        ) : (
          <TheoryLesson
            lesson={current}
            content={content}
            progress={currentProgress}
            enrolled={enrolled}
            onComplete={complete}
            saving={saving}
          />
        )}
      </LessonShell>
    </div>
  );
}
