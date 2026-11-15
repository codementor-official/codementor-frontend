"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon as ArrowLeft,
  BookOpenIcon as BookOpen,
  CodeIcon as Code,
  FileTextIcon as FileText,
  PlayCircleIcon as PlayCircle,
} from "@phosphor-icons/react/ssr";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, LEVEL_LABELS, type ContentStatus, type Level } from "@codementor/types";
import {
  BreadcrumbTitle,
  Card,
  CompletionsPanel,
  CourseCover,
  PageHeader,
  SegmentedTabs,
  StatusBadge,
  buttonClassName,
  useUrlState,
  type CompletionsQuery,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import type { CoursePreview } from "@/features/moderation/types";
import { certificatesApi, moderationApi } from "@/lib/api";
import { LessonPane, type ViewerLesson } from "./lesson-pane";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** `GET /courses/:id` as an administrator sees it: every status, the whole curriculum. */
type CourseDetail = Omit<CoursePreview, "chapters"> & {
  status: ContentStatus;
  shortDescription?: string | null;
  prerequisiteNote?: string | null;
  chapters?: { id: string; title: string; description?: string | null; isOptional: boolean; lessons: ViewerLesson[] }[];
};

const money = (v: number) => (v === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v));

function LessonIcon({ lesson }: { lesson: ViewerLesson }) {
  const Icon = lesson.type === "video" ? PlayCircle : lesson.exerciseId ? Code : FileText;
  return <Icon aria-hidden="true" className="size-4 shrink-0" />;
}

/**
 * Read-only studio for administrators: the curriculum on the left, one lesson at a time on the
 * right, exactly as learners get it (video, body, exercise). Nothing here edits the course.
 */
export function CourseViewer({ id }: { id: string }) {
  const request = useAdminApi();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useUrlState("tab", "content");
  const [lessonId, setLessonId] = useUrlState("lesson", "");
  useEffect(() => {
    moderationApi
      .detail<CourseDetail>(request, "courses", id)
      .then(setCourse)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được khóa học."));
  }, [request, id]);
  const loadCompletions = useCallback(
    (query: CompletionsQuery) => certificatesApi.completions(request, "course", id, query),
    [request, id],
  );

  const flat = useMemo(
    () =>
      (course?.chapters ?? []).flatMap((chapter, c) =>
        chapter.lessons.map((lesson, l) => ({ lesson, chapter, position: `${c + 1}.${l + 1}` })),
      ),
    [course],
  );
  const index = Math.max(0, flat.findIndex((x) => x.lesson.id === lessonId));
  const current = flat[index];

  if (error) return <Card className="p-6 text-sm text-destructive" role="alert">{error}</Card>;
  if (!course) return <Card className="h-64 animate-pulse" aria-busy="true" />;

  return (
    <div className="space-y-4">
      <BreadcrumbTitle href={`/courses/${id}`} slug={id} title={course.title} />
      <PageHeader
        action={
          <Link className={buttonClassName("outline", "sm")} href="/courses">
            <ArrowLeft aria-hidden="true" className="size-4" /> Danh sách khóa học
          </Link>
        }
        description={`${course.totalChapters} chương · ${course.totalLessons} bài · chỉ xem`}
        icon={BookOpen}
        title={course.title}
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={CONTENT_STATUS_TONES[course.status] ?? "neutral"}>{CONTENT_STATUS_LABELS[course.status] ?? course.status}</StatusBadge>
        <SegmentedTabs
          onChange={setTab}
          options={[
            { value: "content", label: "Nội dung" },
            { value: "info", label: "Thông tin" },
            { value: "completions", label: "Đã hoàn thành" },
          ]}
          value={tab}
        />
      </div>

      {tab === "info" ? (
        <Card className="grid gap-5 p-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <CourseCover className="aspect-video w-full rounded-lg" src={course.coverImageUrl} title={course.title} />
          <div className="min-w-0 space-y-3 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <Fact label="Trình độ" value={LEVEL_LABELS[course.level as Level] ?? course.level} />
              <Fact label="Thời lượng" value={course.durationHours ? `${course.durationHours} giờ` : "—"} />
              <Fact label="Giá" value={money(course.priceVnd ?? 0)} />
              {course.pendingPriceVnd != null && <Fact label="Giá chờ duyệt" value={money(course.pendingPriceVnd)} />}
              <Fact label="Nội dung" value={`${course.totalChapters} chương · ${course.totalLessons} bài`} />
            </dl>
            {course.shortDescription && <Block label="Mô tả ngắn">{course.shortDescription}</Block>}
            {course.description && <Block label="Mô tả">{course.description}</Block>}
            {course.prerequisiteNote && <Block label="Yêu cầu trước khi học">{course.prerequisiteNote}</Block>}
            {course.rejectionReason && <Block label={course.status === "pending_review" ? "Ghi chú gửi duyệt" : "Lý do / ghi chú"}>{course.rejectionReason}</Block>}
          </div>
        </Card>
      ) : tab === "completions" ? (
        <CompletionsPanel load={loadCompletions} verifyBaseUrl={CLIENT_URL} />
      ) : flat.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">Khóa học chưa có bài học nào.</Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="min-w-0 p-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <nav aria-label="Mục lục khóa học">
              <ol className="space-y-3">
                {(course.chapters ?? []).map((chapter, c) => (
                  <li key={chapter.id}>
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                      Chương {c + 1}. {chapter.title}
                      {chapter.isOptional && <span className="ml-1 normal-case">(tuỳ chọn)</span>}
                    </p>
                    {chapter.lessons.length === 0 ? (
                      <p className="px-2 text-xs text-destructive">Chương rỗng.</p>
                    ) : (
                      <ul>
                        {chapter.lessons.map((lesson) => {
                          const active = lesson.id === current?.lesson.id;
                          const empty = !lesson.exerciseId && lesson.contentRef === null;
                          return (
                            <li key={lesson.id}>
                              <button
                                aria-current={active ? "true" : undefined}
                                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${active ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"}`}
                                onClick={() => setLessonId(lesson.id)}
                                type="button"
                              >
                                <LessonIcon lesson={lesson} />
                                <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                                {empty && <span className="text-2xs text-destructive">trống</span>}
                                {lesson.durationMinutes ? <span className="text-2xs text-muted-foreground">{lesson.durationMinutes}′</span> : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </Card>
          {current && (
            <LessonPane
              chapterTitle={current.chapter.title}
              courseId={id}
              key={current.lesson.id}
              lesson={current.lesson}
              next={flat[index + 1]?.lesson ?? null}
              onSelect={setLessonId}
              position={current.position}
              prev={flat[index - 1]?.lesson ?? null}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Block({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-line">{children}</p>
    </div>
  );
}
