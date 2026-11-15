"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BracketsCurlyIcon as Braces,
  CaretDownIcon as ChevronDown,
  CaretRightIcon as ChevronRight,
  CursorClickIcon as Pointer,
  FileTextIcon as FileText,
  LockOpenIcon as Unlock,
  PlayCircleIcon as PlayCircle,
} from "@phosphor-icons/react/ssr";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, LESSON_TYPE_LABELS, LEVEL_LABELS, type ContentStatus, type LessonType, type Level } from "@codementor/types";
import { StudioScroll, StudioShell } from "@codementor/solve";
import {
  BreadcrumbTitle,
  Card,
  CompletionsPanel,
  CourseCover,
  StatusBadge,
  StudioSplit,
  useUrlState,
  type CompletionsQuery,
} from "@codementor/ui";
import { useAdminApi } from "@/features/auth/admin-api";
import type { CoursePreview } from "@/features/moderation/types";
import { certificatesApi, moderationApi } from "@/lib/api";
import { LessonPane, type ViewerLesson } from "./lesson-pane";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const EXERCISE_TYPES = ["exercise", "quiz", "challenge", "project"];

type Chapter = { id: string; title: string; description?: string | null; isOptional: boolean; lessons: ViewerLesson[] };
/** `GET /courses/:id` as an administrator sees it: every status, the whole curriculum. */
type CourseDetail = Omit<CoursePreview, "chapters"> & {
  slug?: string;
  status: ContentStatus;
  shortDescription?: string | null;
  prerequisiteNote?: string | null;
  submitNote?: string | null;
  chapters?: Chapter[];
};

const money = (v: number) => (v === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v));

/**
 * The lecturer studio, read-only, for administrators: same header, same split, same tree; the
 * right pane shows the selected chapter or lesson exactly as learners get it. Nothing edits.
 */
export function CourseViewer({ id }: { id: string }) {
  const request = useAdminApi();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useUrlState("tab", "curriculum");
  // "l:<lessonId>" or "c:<chapterId>"; empty = nothing selected, as in the lecturer studio.
  const [selected, setSelected] = useUrlState("sel", "");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
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

  const chapters = useMemo(() => course?.chapters ?? [], [course]);
  const flat = useMemo(
    () => chapters.flatMap((chapter, c) => chapter.lessons.map((lesson, l) => ({ lesson, chapter, position: `${c + 1}.${l + 1}` }))),
    [chapters],
  );
  const lessonIndex = selected.startsWith("l:") ? flat.findIndex((x) => x.lesson.id === selected.slice(2)) : -1;
  const chapterIndex = selected.startsWith("c:") ? chapters.findIndex((c) => c.id === selected.slice(2)) : -1;

  if (error) return <div className="p-6"><Card className="p-6 text-sm text-destructive" role="alert">{error}</Card></div>;
  if (!course) return <div className="p-6"><Card className="h-64 animate-pulse" aria-busy="true" /></div>;

  const current = lessonIndex >= 0 ? flat[lessonIndex] : null;
  const toggle = (chapterId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });

  return (
    <>
      <BreadcrumbTitle href={`/courses/${id}`} slug={id} title={course.title} />
      <StudioShell
        actions={<span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">Chỉ xem</span>}
        backHref="/courses"
        backLabel="Khóa học"
        meta={`${course.totalChapters} chương · ${course.totalLessons} bài${course.durationHours ? ` · ${course.durationHours} giờ` : ""}`}
        rejectionReason={course.status === "pending_review" ? null : course.rejectionReason}
        slug={course.slug ?? id}
        status={<StatusBadge tone={CONTENT_STATUS_TONES[course.status] ?? "neutral"}>{CONTENT_STATUS_LABELS[course.status] ?? course.status}</StatusBadge>}
        submissionNote={course.status === "pending_review" ? course.submitNote ?? course.rejectionReason : null}
        tabs={{
          options: [
            { value: "curriculum", label: "Nội dung" },
            { value: "info", label: "Thông tin" },
            { value: "completions", label: "Đã hoàn thành" },
          ],
          value: tab,
          onChange: setTab,
        }}
        title={course.title}
      >
        {tab === "info" ? (
          <StudioScroll>
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
              </div>
            </Card>
          </StudioScroll>
        ) : tab === "completions" ? (
          <StudioScroll>
            <CompletionsPanel load={loadCompletions} verifyBaseUrl={CLIENT_URL} />
          </StudioScroll>
        ) : (
          <StudioSplit
            start={{
              id: "tree",
              defaultSize: "45%",
              minSize: "25%",
              content: (
                <div className="h-full overflow-y-auto p-3">
                  <h2 className="mb-3 text-sm font-semibold">Nội dung khóa học</h2>
                  {chapters.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">Khóa học chưa có chương nào.</p>
                  ) : (
                    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
                      {chapters.map((chapter, c) => {
                        const open = !collapsed.has(chapter.id);
                        const active = selected === `c:${chapter.id}`;
                        return (
                          <li className="rounded-lg border bg-card" key={chapter.id}>
                            <div className={`flex items-center gap-1.5 px-2 py-2 ${active ? "bg-muted" : ""}`}>
                              <button aria-label={open ? "Thu gọn chương" : "Mở chương"} className="text-muted-foreground hover:text-foreground" onClick={() => toggle(chapter.id)} type="button">
                                {open ? <ChevronDown aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />}
                              </button>
                              <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setSelected(`c:${chapter.id}`)} type="button">
                                {c + 1}. {chapter.title}
                                {chapter.isOptional && <span className="ml-2 text-xs font-normal text-muted-foreground">tuỳ chọn</span>}
                              </button>
                              <span className="shrink-0 text-xs text-muted-foreground">{chapter.lessons.length} bài</span>
                            </div>
                            {open && (
                              <ul className="border-t px-2 py-1.5">
                                {chapter.lessons.length === 0 && <li className="px-6 py-2 text-xs text-destructive">Chương rỗng — chưa có bài học.</li>}
                                {chapter.lessons.map((lesson, l) => {
                                  const Icon = EXERCISE_TYPES.includes(lesson.type) ? Braces : lesson.type === "video" ? PlayCircle : FileText;
                                  const empty = !lesson.exerciseId && lesson.contentRef === null;
                                  return (
                                    <li className={`flex items-center gap-1.5 rounded-md px-1 py-1 ${selected === `l:${lesson.id}` ? "bg-muted" : ""}`} key={lesson.id}>
                                      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                                      <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setSelected(`l:${lesson.id}`)} type="button">
                                        <span className="text-muted-foreground">Bài {l + 1}.</span> {lesson.title}
                                        <span className="ml-2 text-xs text-muted-foreground">{LESSON_TYPE_LABELS[lesson.type as LessonType] ?? lesson.type}</span>
                                      </button>
                                      {empty && <span className="shrink-0 text-2xs text-destructive">trống</span>}
                                      {lesson.isPreview && (
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground" title="Cho học trước, mở cho mọi người">
                                          <Unlock aria-hidden="true" className="size-3" /> học trước
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ),
            }}
            end={{
              id: "inspector",
              defaultSize: "55%",
              minSize: "30%",
              content: (
                <div className="h-full overflow-y-auto p-3">
                  {current ? (
                    <LessonPane
                      chapterTitle={current.chapter.title}
                      courseId={id}
                      key={current.lesson.id}
                      lesson={current.lesson}
                      next={flat[lessonIndex + 1]?.lesson ?? null}
                      onSelect={(lessonId) => setSelected(`l:${lessonId}`)}
                      position={current.position}
                      prev={flat[lessonIndex - 1]?.lesson ?? null}
                    />
                  ) : chapterIndex >= 0 ? (
                    <ChapterPane chapter={chapters[chapterIndex]} index={chapterIndex} onSelect={(lessonId) => setSelected(`l:${lessonId}`)} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                      <span className="flex size-10 items-center justify-center rounded-full bg-muted"><Pointer aria-hidden="true" className="size-5" /></span>
                      <p className="font-medium text-foreground">Chưa chọn mục nào</p>
                      <p>Chọn một chương hoặc một bài ở cây bên trái để xem chi tiết.</p>
                    </div>
                  )}
                </div>
              ),
            }}
          />
        )}
      </StudioShell>
    </>
  );
}

function ChapterPane({ chapter, index, onSelect }: { chapter: Chapter; index: number; onSelect: (lessonId: string) => void }) {
  const minutes = chapter.lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">Chương {index + 1}{chapter.isOptional ? " · tuỳ chọn" : ""}</p>
      <h2 className="mt-1 text-lg font-semibold">{chapter.title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{chapter.lessons.length} bài{minutes ? ` · ${minutes} phút` : ""}</p>
      {chapter.description && <p className="mt-3 text-sm whitespace-pre-line">{chapter.description}</p>}
      <ol className="mt-4 divide-y rounded-md border">
        {chapter.lessons.map((lesson, l) => (
          <li key={lesson.id}>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => onSelect(lesson.id)} type="button">
              <span className="text-muted-foreground">Bài {l + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
              <span className="text-xs text-muted-foreground">{LESSON_TYPE_LABELS[lesson.type as LessonType] ?? lesson.type}</span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
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
