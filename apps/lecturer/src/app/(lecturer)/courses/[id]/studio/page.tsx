"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Button, Card, PageHeader, SegmentedTabs, StatusBadge } from "@codementor/ui";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { CurriculumTree, type Selection } from "@/features/courses/curriculum-tree";
import { Inspector } from "@/features/courses/inspector";
import {
  toDraft,
  toPayload,
  type Course,
  type DraftChapter,
  type LessonContent,
} from "@/features/courses/types";
import type { ExerciseListItem } from "@/features/exercises/types";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  LEVELS,
  LEVEL_LABELS,
  MODES,
  MODE_LABELS,
} from "@/features/roadmaps/types";
import { api } from "@/lib/api";

interface Meta {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  level: string;
  progressionMode: string;
  prerequisiteNote: string;
}

function toMeta(course: Course): Meta {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description ?? "",
    coverImageUrl: course.coverImageUrl ?? "",
    level: course.level,
    progressionMode: course.progressionMode,
    prerequisiteNote: course.prerequisiteNote ?? "",
  };
}

export default function CourseStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<"curriculum" | "metadata">("curriculum");
  const [course, setCourse] = useState<Course | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [chapters, setChapters] = useState<DraftChapter[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = useCallback((loaded: Course) => {
    setCourse(loaded);
    setMeta(toMeta(loaded));
    setChapters(toDraft(loaded.chapters ?? []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.courses
      .get(id)
      .then((loaded) => {
        if (!cancelled) apply(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, apply]);

  useEffect(() => {
    let cancelled = false;
    // Kho bài để gắn vào ô, cộng bài của chính mình — bài chưa công khai của mình vẫn
    // dùng được trong khóa học của mình.
    Promise.all([api.exercises.bank({ limit: 100 }), api.exercises.mine({ limit: 100 })])
      .then(([bank, mine]) => {
        if (cancelled) return;
        const seen = new Map<string, ExerciseListItem>();
        for (const item of [...mine.items, ...bank.items]) seen.set(item.id, item);
        setExercises([...seen.values()]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<Course>, done: string) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      apply(await action());
      setNotice(done);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  const loadContent = useCallback(
    (lessonId: string) => api.courses.lessonContent(id, lessonId),
    [id],
  );
  const saveContent = useCallback(
    async (lessonId: string, content: LessonContent) => {
      await api.courses.saveLessonContent(id, lessonId, content);
    },
    [id],
  );

  if (error && !course) {
    return (
      <>
        <PageHeader title="Studio khóa học" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </>
    );
  }

  if (!course || !meta) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  const locked = course.status === "pending_review";
  const patchMeta = (partial: Partial<Meta>) => setMeta({ ...meta, ...partial });

  return (
    <>
      <Link
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        href="/courses"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Khóa học
      </Link>

      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            {locked ? (
              <Button
                disabled={saving}
                onClick={() => run(() => api.courses.withdraw(id), "Đã hủy gửi duyệt")}
                type="button"
                variant="outline"
              >
                <Undo2 aria-hidden="true" className="size-4" />
                Hủy gửi duyệt
              </Button>
            ) : (
              <>
                <Button
                  disabled={saving}
                  onClick={() =>
                    run(async () => {
                      // Metadata trước, cây sau: cây trả về đã kèm số chương/bài do
                      // trigger cập nhật, nên nó phải là câu trả lời cuối cùng.
                      await api.courses.update(id, {
                        ...(meta.slug !== course.slug ? { slug: meta.slug } : {}),
                        title: meta.title,
                        description: meta.description || null,
                        coverImageUrl: meta.coverImageUrl || null,
                        level: meta.level,
                        progressionMode: meta.progressionMode,
                        prerequisiteNote: meta.prerequisiteNote || null,
                      });
                      return api.courses.saveCurriculum(id, toPayload(chapters));
                    }, "Đã lưu")
                  }
                  type="button"
                  variant="outline"
                >
                  <Save aria-hidden="true" className="size-4" />
                  {saving ? "Đang lưu…" : "Lưu"}
                </Button>
                <Button
                  disabled={saving}
                  onClick={() => run(() => api.courses.submit(id), "Đã gửi duyệt")}
                  type="button"
                >
                  <Send aria-hidden="true" className="size-4" />
                  Gửi duyệt
                </Button>
              </>
            )}
          </div>
        }
        description={course.slug}
        title={meta.title || "Khóa học chưa đặt tên"}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
          {CONTENT_STATUS_LABELS[course.status]}
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          {course.totalChapters} chương · {course.totalLessons} bài ·{" "}
          {course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"}
        </span>
        {locked && (
          <span className="text-sm text-muted-foreground">Đang chờ duyệt nên không sửa được.</span>
        )}
      </div>

      {course.rejectionReason && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Lý do bị trả về: {course.rejectionReason}
        </p>
      )}
      {error && (
        <p
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}

      <div className="mb-4">
        <SegmentedTabs
          onChange={(value) => setTab(value as "curriculum" | "metadata")}
          options={[
            { value: "curriculum", label: "Nội dung" },
            { value: "metadata", label: "Thông tin khóa học" },
          ]}
          value={tab}
        />
      </div>

      {tab === "curriculum" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="p-4">
            <CurriculumTree
              chapters={chapters}
              disabled={locked}
              onChange={setChapters}
              onSelect={setSelection}
              selection={selection}
            />
          </Card>

          {/* Sidebar cố định: cuộn theo trang nhưng luôn ở trong tầm mắt trên màn rộng. */}
          <Card className="h-fit p-5 lg:sticky lg:top-20">
            <Inspector
              chapters={chapters}
              disabled={locked}
              exercises={exercises}
              loadContent={loadContent}
              onChange={setChapters}
              saveContent={saveContent}
              selection={selection}
            />
          </Card>
        </div>
      ) : (
        <fieldset className="grid gap-4 lg:grid-cols-3" disabled={locked}>
          <Card className="p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold">Thông tin khóa học</h2>

            <Field htmlFor="title" label="Tiêu đề">
              <input
                className={inputClassName}
                id="title"
                onChange={(event) => patchMeta({ title: event.target.value })}
                value={meta.title}
              />
            </Field>

            <Field
              hint={
                course.status === "published"
                  ? "Đã công khai nên không đổi được."
                  : "Phần định danh trong đường dẫn."
              }
              htmlFor="slug"
              label="Slug"
            >
              <input
                className={inputClassName}
                disabled={course.status === "published"}
                id="slug"
                onChange={(event) => patchMeta({ slug: event.target.value })}
                value={meta.slug}
              />
            </Field>

            <Field htmlFor="description" hint="Bắt buộc có để gửi duyệt." label="Mô tả">
              <textarea
                className={textareaClassName}
                id="description"
                onChange={(event) => patchMeta({ description: event.target.value })}
                value={meta.description}
              />
            </Field>

            <Field htmlFor="coverImageUrl" hint="http:// hoặc https://" label="Ảnh bìa (URL)">
              <input
                className={inputClassName}
                id="coverImageUrl"
                onChange={(event) => patchMeta({ coverImageUrl: event.target.value })}
                placeholder="https://"
                value={meta.coverImageUrl}
              />
            </Field>

            <Field htmlFor="prerequisiteNote" label="Ghi chú điều kiện tiên quyết">
              <textarea
                className={textareaClassName}
                id="prerequisiteNote"
                onChange={(event) => patchMeta({ prerequisiteNote: event.target.value })}
                value={meta.prerequisiteNote}
              />
            </Field>
          </Card>

          <Card className="h-fit p-5">
            <h2 className="mb-4 text-sm font-semibold">Phân loại</h2>

            <Field htmlFor="level" label="Trình độ">
              <select
                className={inputClassName}
                id="level"
                onChange={(event) => patchMeta({ level: event.target.value })}
                value={meta.level}
              >
                {LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {LEVEL_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>

            <Field htmlFor="progressionMode" label="Cách mở khóa">
              <select
                className={inputClassName}
                id="progressionMode"
                onChange={(event) => patchMeta({ progressionMode: event.target.value })}
                value={meta.progressionMode}
              >
                {MODES.map((value) => (
                  <option key={value} value={value}>
                    {MODE_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
          </Card>
        </fieldset>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          disabled={saving || course.status === "published"}
          onClick={() =>
            run(async () => {
              await api.courses.remove(id);
              router.push("/courses");
              return course;
            }, "Đã xoá")
          }
          type="button"
          variant="ghost"
        >
          Xoá khóa học này
        </Button>
      </div>
    </>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
