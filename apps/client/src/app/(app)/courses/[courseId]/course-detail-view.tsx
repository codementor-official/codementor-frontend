"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Asterisk,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  FileText,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  Plus,
  RotateCcw,
  Trophy,
  Unlock,
} from "lucide-react";
import { StatStrip } from "@codementor/ui";
import { BreadcrumbTitle } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { consumeCourseCelebration, markCourseCelebrated } from "@/lib/course-celebration";
import { describeLock, explainLock, isLessonLocked } from "@/lib/lesson-unlock";
import { placeholderCoverUrl } from "@/lib/placeholder-image";
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

/** Vãi confetti một lượt rồi thôi — `canvas-confetti` tự dọn canvas của nó khi rơi hết. */
function fireConfetti() {
  const colors = ["#f59e0b", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, angle: 60, colors });
  confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, angle: 120, colors });
}

export function CourseDetailView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  // Every chapter starts expanded (same as before this got collapsible) — this tracks only
  // the ones a learner has explicitly closed.
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(() => new Set());
  const toggleChapter = (chapterId: string) =>
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  // Vừa bấm "Hoàn thành khóa học" ở bài cuối thì ăn mừng — cờ do trang bài học đặt vào
  // `sessionStorage` TRƯỚC khi điều hướng, xem `lib/course-celebration.ts` để biết vì sao
  // không đọc từ query param. Đọc trong effect (sau khi mount) vì `sessionStorage` không
  // tồn tại ở server, và bản thân việc đọc đã xoá cờ nên chạy lại cũng vô hại.
  useEffect(() => {
    if (!consumeCourseCelebration(courseId)) return;
    markCourseCelebrated(courseId);
    fireConfetti();
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
      // Đăng ký xong là để học, nên đi thẳng vào bài đầu tiên. Ở lại trang này chỉ đổi một
      // cái nút rồi bắt người học tự tìm chỗ bấm tiếp.
      const first = course ? flatLessons(course)[0] : undefined;
      if (first) {
        router.push(`/courses/${courseId}/lessons/${first.id}`);
        return;
      }
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
  const lessons = flatLessons(course);
  const firstOpen = lessons.find(
    (lesson) => progressByLesson.get(lesson.id)?.status !== "completed",
  );
  const completed = enrolled && lessons.length > 0 && !firstOpen;
  /** Where the action button lands: the next unfinished lesson, or back to the start. */
  const resumeLesson = firstOpen ?? lessons[0];

  const lessonCount = course.chapters.reduce((total, ch) => total + ch.lessons.length, 0);

  const curriculum =
    course.chapters.length === 0 ? (
      <Card className="border-dashed p-8 text-center">
        <p className="text-sm font-semibold text-navy">Khóa học chưa có chương nào</p>
        <p className="mt-1 text-xs text-text-faint">Giảng viên đang biên soạn nội dung.</p>
      </Card>
    ) : (
      <ul className="flex flex-col gap-3">
        {[...course.chapters]
          .sort((a, b) => a.position - b.position)
          .map((chapter, chapterIndex) => {
            const chapterCollapsed = collapsedChapters.has(chapter.id);
            return (
              <li key={chapter.id}>
                <Card className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.id)}
                    aria-expanded={!chapterCollapsed}
                    className="flex w-full items-baseline justify-between gap-3 border-b border-border-soft bg-bg px-4 py-3 text-left"
                  >
                    {/* Đánh số theo VỊ TRÍ trong danh sách đã sắp, không theo `position`
                      * thô: xoá một chương giữa chừng để lại khoảng trống ở `position`,
                      * và học viên sẽ đọc được "Chương 1, Chương 3". */}
                    <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-navy">
                      <span className="truncate">
                        Chương {chapterIndex + 1}: {chapter.title}
                      </span>
                      {/* Tùy chọn chỉ đáng nói khi đã ghi danh: người chưa học chưa có gì
                        * để "tính là hoàn thành" cả, nên cờ này chưa có ý nghĩa với họ. */}
                      {chapter.isOptional && enrolled && (
                        <span
                          className="shrink-0"
                          title="Chương tùy chọn — bỏ qua được mà vẫn tính là hoàn thành khóa học"
                        >
                          <Asterisk aria-hidden="true" className="size-3.5 text-text-faint" />
                        </span>
                      )}
                    </h3>
                    <span className="flex shrink-0 items-center gap-2 text-2xs text-text-faint">
                      {chapter.lessons.length} bài
                      {chapterCollapsed ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                  {!chapterCollapsed && (
                    <ul className="divide-y divide-border-soft">
                      {[...chapter.lessons]
                        .sort((a, b) => a.position - b.position)
                        .map((lesson, lessonIndex) => {
                          const Icon = LESSON_ICON[lesson.type] ?? FileText;
                          const state = progressByLesson.get(lesson.id);
                          const locked = isLessonLocked(lesson, state, enrolled);
                          const reason = locked ? explainLock(course, lesson, progressByLesson) : null;
                          const body = (
                            <>
                              {state?.status === "completed" ? (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                              ) : locked ? (
                                <Lock className="h-4 w-4 shrink-0 text-text-faint" />
                              ) : (
                                <Icon className="h-4 w-4 shrink-0 text-text-faint" />
                              )}
                              <span className="min-w-0 flex-1 truncate text-sm text-text">
                                <span className="text-text-faint">Bài {lessonIndex + 1}.</span>{" "}
                                {lesson.title}
                              </span>
                              {/* Cho học trước: luôn đáng nói, kể cả chưa ghi danh — đó chính
                                * là đối tượng nó nhắm tới, người còn đang cân nhắc có học hay
                                * không. Tùy chọn thì ngược lại, chỉ đáng nói khi đã ghi danh —
                                * xem chú thích cùng cờ này ở tiêu đề chương. */}
                              {lesson.isPreview && (
                                <span
                                  className="shrink-0"
                                  title="Cho học trước — xem được ngay, không cần ghi danh hay hoàn thành bài trước đó"
                                >
                                  <Unlock aria-hidden="true" className="size-3.5 text-text-faint" />
                                </span>
                              )}
                              {lesson.isOptional && enrolled && (
                                <span
                                  className="shrink-0"
                                  title="Bài tùy chọn — bỏ qua được mà vẫn tính là hoàn thành khóa học"
                                >
                                  <Asterisk aria-hidden="true" className="size-3.5 text-text-faint" />
                                </span>
                              )}
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
                                <div className="cursor-not-allowed px-4 py-2.5 opacity-70">
                                  <div className="flex items-center gap-3">{body}</div>
                                  {/* Ổ khoá không kèm điều kiện thì học viên chỉ biết là
                                    * "chưa mở", không biết phải làm gì để mở. */}
                                  <p className="mt-1 pl-7 text-2xs text-text-faint">
                                    {describeLock(reason)}
                                    {reason && (
                                      <span className="font-semibold text-text-muted">
                                        {" "}
                                        {reason.missing
                                          .map((item) => `${item.number} — ${item.title}`)
                                          .join("; ")}
                                      </span>
                                    )}
                                  </p>
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
                  )}
                </Card>
              </li>
            );
          })}
      </ul>
    );

  return (
    <div>
      <BreadcrumbTitle slug={courseId} title={course.title} />

      {/* Một lưới 2 cột cho CẢ trang, không phải hero riêng rồi nội dung riêng: tách đôi như
        * vậy thì cột trái của hero chỉ có tiêu đề và vài con số, còn cột phải cao gấp đôi —
        * để lại một mảng trắng rỗng và đẩy toàn bộ nội dung khóa học xuống dưới nó. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <PageHeader icon={BookOpen} title={course.title} subtitle={course.description ?? undefined} />
          <StatStrip
            className="mt-4 mb-6"
            stats={[
              { label: "Trình độ", value: LEVEL_LABEL[course.level] ?? course.level },
              { label: "Chương", value: course.chapters.length },
              { label: "Bài học", value: lessonCount },
              { label: "Giờ học", value: course.durationHours ?? "—" },
            ]}
          />

          <section>
            <h2 className="mb-3 text-base font-bold text-navy">Nội dung khóa học</h2>
            {curriculum}
          </section>
        </div>

        {/* Dính khi cuộn: danh sách chương dài hơn cột này rất nhiều, và nút bắt đầu học là
          * thứ người học cần với tới ở bất kỳ đoạn nào của danh sách. */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-5">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-border-soft bg-border-soft">
            <Image
              src={course.coverImageUrl || placeholderCoverUrl(course.slug)}
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold text-navy">Bắt đầu học</h2>
            {enrolled ? (
              <>
                {/* Completion is a status line, not a button. It used to replace the action
                  * entirely, which left a finished learner with no way back into the lessons. */}
                {completed && (
                  <p className="mb-2.5 flex items-center gap-1.5 rounded-md bg-primary-tint px-3 py-2 text-xs font-semibold text-primary">
                    <Trophy className="h-4 w-4 shrink-0" /> Đã hoàn thành khóa học
                  </p>
                )}
                {resumeLesson ? (
                  <Link
                    href={`/courses/${courseId}/lessons/${resumeLesson.id}`}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      completed
                        ? "border border-border bg-surface text-navy hover:bg-bg"
                        : "bg-primary text-on-ink hover:bg-primary-hover"
                    }`}
                  >
                    {completed ? (
                      <>
                        <RotateCcw className="h-4 w-4" /> Xem lại khóa học
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" /> Tiếp tục học
                      </>
                    )}
                  </Link>
                ) : (
                  <p className="text-xs text-text-faint">Khóa học chưa có bài nào để mở.</p>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={enroll}
                disabled={enrolling}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-on-ink transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Đăng ký học
              </button>
            )}
            {enrollment && (
              <p className="mt-2.5 text-2xs text-text-faint">
                Đã học {enrollment.completedLessons}/{lessonCount} bài · {enrollment.progressPercent}%
              </p>
            )}
            {/* Yêu cầu đầu vào ở cùng thẻ với nút đăng ký, và CHỈ với người chưa ghi danh:
              * nó là thứ để cân nhắc trước khi bấm. Người đã học rồi thì nó chỉ còn là chữ
              * thừa chiếm chỗ giữa trang. */}
            {!enrolled && course.prerequisiteNote && (
              <div className="mt-3 border-t border-border-soft pt-3">
                <h3 className="mb-1 text-xs font-bold text-navy">Yêu cầu đầu vào</h3>
                <p className="text-xs leading-relaxed text-text-muted">{course.prerequisiteNote}</p>
              </div>
            )}
          </Card>

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
