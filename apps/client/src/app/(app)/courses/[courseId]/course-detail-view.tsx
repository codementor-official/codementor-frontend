"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Clock, FileText, Layers, Loader2, Lock, PlayCircle, Code2 } from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { CourseDetail, CourseProgress } from "@/types/catalogue";

const LEVEL_LABEL: Record<string, string> = {
  none: "Chưa có nền",
  basic: "Cơ bản",
  intermediate: "Trung cấp",
  experienced: "Nâng cao",
};

const LESSON_ICON: Record<string, typeof FileText> = {
  video: PlayCircle,
  article: FileText,
  exercise: Code2,
};



/** Chapters flattened into learning order — the same order the backend gates on. */
function flatLessons(course: CourseDetail) {
  return [...course.chapters]
    .sort((a, b) => a.position - b.position)
    .flatMap((chapter) => [...chapter.lessons].sort((a, b) => a.position - b.position));
}

export function CourseDetailView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.courses.detail(courseId), api.courses.progress(courseId)])
      .then(([courseData, progressData]) => {
        if (cancelled) return;
        setCourse(courseData);
        setProgress(progressData);
      })
      .catch((cause: unknown) =>
        !cancelled && setError(cause instanceof Error ? cause.message : "Không tải được khóa học"),
      );
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const enroll = async () => {
    setEnrolling(true);
    try {
      await api.courses.enroll(courseId);
      setProgress(await api.courses.progress(courseId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đăng ký được khóa học");
    } finally {
      setEnrolling(false);
    }
  };

  if (error) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-sm font-semibold text-navy">Không mở được khóa học này</p>
        <p className="mt-1 text-xs text-text-muted">{error}</p>
        <Link href="/courses" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
          Quay lại danh sách khóa học
        </Link>
      </Card>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center gap-2 p-10 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải khóa học...
      </div>
    );
  }

  const progressByLesson = new Map((progress?.lessons ?? []).map((l) => [l.lessonId, l]));
  const enrollment = progress?.enrollment ?? null;
  const enrolled = enrollment !== null && enrollment.status !== "dropped";
  const firstOpen = flatLessons(course).find(
    (lesson) => progressByLesson.get(lesson.id)?.status !== "completed",
  );

  const lessonCount = course.chapters.reduce((total, ch) => total + ch.lessons.length, 0);

  return (
    <div>
      <BreadcrumbTitle slug={courseId} title={course.title} />
      <PageHeader
        title={course.title}
        subtitle={course.description ?? undefined}
        actions={
          enrolled ? (
            firstOpen ? (
              <Link
                href={`/courses/${courseId}/lessons/${firstOpen.id}`}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-on-ink transition-colors hover:bg-primary-hover"
              >
                Tiếp tục học
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 rounded-md bg-primary-tint px-3.5 py-2 text-sm font-semibold text-primary">
                <Check className="h-4 w-4" /> Đã hoàn thành khóa học
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={enroll}
              disabled={enrolling}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-on-ink transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {enrolling && <Loader2 className="h-4 w-4 animate-spin" />} Đăng ký học
            </button>
          )
        }
      />

      <StatStrip
        className="mb-5"
        stats={[
          { label: "Trình độ", value: LEVEL_LABEL[course.level] ?? course.level },
          { label: "Chương", value: course.chapters.length },
          { label: "Bài học", value: lessonCount },
          { label: "Giờ học", value: course.durationHours ?? "—" },
          ...(enrollment
            ? [
                { label: "Đã học", value: `${enrollment.completedLessons}/${lessonCount}` },
                { label: "Tiến độ", value: `${enrollment.progressPercent}%` },
              ]
            : []),
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <h2 className="mb-3 text-base font-bold text-navy">Nội dung khóa học</h2>
          {course.chapters.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-navy">Khóa học chưa có chương nào</p>
              <p className="mt-1 text-xs text-text-faint">Giảng viên đang biên soạn nội dung.</p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {course.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Card className="overflow-hidden">
                    <div className="flex items-baseline justify-between gap-3 border-b border-border-soft bg-bg px-4 py-3">
                      <h3 className="text-sm font-bold text-navy">
                        {chapter.position}. {chapter.title}
                      </h3>
                      <span className="shrink-0 text-2xs text-text-faint">
                        {chapter.lessons.length} bài
                      </span>
                    </div>
                    <ul className="divide-y divide-border-soft">
                      {chapter.lessons.map((lesson) => {
                        const Icon = LESSON_ICON[lesson.type] ?? FileText;
                        const state = progressByLesson.get(lesson.id);
                        const locked = state?.isAvailable === false;
                        const body = (
                          <>
                            {state?.status === "completed" ? (
                              <Check className="h-4 w-4 shrink-0 text-primary" />
                            ) : locked ? (
                              <Lock className="h-4 w-4 shrink-0 text-text-faint" />
                            ) : (
                              <Icon className="h-4 w-4 shrink-0 text-text-faint" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm text-text">{lesson.title}</span>
                            {lesson.durationMinutes !== null && (
                              <span className="shrink-0 text-2xs text-text-faint">
                                {lesson.durationMinutes} phút
                              </span>
                            )}
                          </>
                        );
                        return (
                          <li key={lesson.id}>
                            {/* Locked lessons are not links: the server refuses them, so a
                              * click would only teach that the app says no at random. */}
                            {locked ? (
                              <div className="flex cursor-not-allowed items-center gap-3 px-4 py-2.5 opacity-60">
                                {body}
                              </div>
                            ) : (
                              <Link
                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg"
                              >
                                {body}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          {course.prerequisiteNote && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-bold text-navy">Yêu cầu đầu vào</h2>
              <p className="text-xs leading-relaxed text-text-muted">{course.prerequisiteNote}</p>
            </Card>
          )}
          <Card className="p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-navy">
              <BookOpen className="h-4 w-4 text-primary" /> Thông tin
            </h2>
            <dl className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">Cập nhật</dt>
                <dd className="text-navy">{new Date(course.updatedAt).toLocaleDateString("vi-VN")}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1 text-text-muted">
                  <Layers className="h-3.5 w-3.5" /> Chương
                </dt>
                <dd className="text-navy">{course.chapters.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1 text-text-muted">
                  <Clock className="h-3.5 w-3.5" /> Thời lượng
                </dt>
                <dd className="text-navy">{course.durationHours ?? "—"} giờ</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
