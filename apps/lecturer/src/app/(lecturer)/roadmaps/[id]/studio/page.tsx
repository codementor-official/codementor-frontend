"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Group, Panel } from "react-resizable-panels";
import { Button, Card, PageHeader, ResizeHandle, StatusBadge } from "@codementor/ui";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { CourseLibrary, PickedCourses, type PickedCourse } from "@/features/roadmaps/course-picker";
import type { CourseListItem } from "@/features/courses/types";
import { api } from "@/lib/api";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  FIELDS,
  FIELD_LABELS,
  LEVELS,
  LEVEL_LABELS,
  MODES,
  MODE_LABELS,
  type Roadmap,
} from "@/features/roadmaps/types";

interface Draft {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  field: string;
  level: string;
  coverImageUrl: string;
  progressionMode: string;
  prerequisiteNote: string;
}

function toDraft(roadmap: Roadmap): Draft {
  return {
    slug: roadmap.slug,
    title: roadmap.title,
    shortDescription: roadmap.shortDescription ?? "",
    description: roadmap.description ?? "",
    field: roadmap.field,
    level: roadmap.level,
    coverImageUrl: roadmap.coverImageUrl ?? "",
    progressionMode: roadmap.progressionMode,
    prerequisiteNote: roadmap.prerequisiteNote ?? "",
  };
}

export default function RoadmapStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<"courses" | "metadata">("courses");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picked, setPicked] = useState<PickedCourse[]>([]);
  const [available, setAvailable] = useState<CourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = useCallback((loaded: Roadmap) => {
    setRoadmap(loaded);
    setDraft(toDraft(loaded));
    setPicked(
      (loaded.courses ?? []).map((course) => ({
        courseId: course.courseId,
        title: course.title,
        status: course.status,
        durationHours: course.durationHours,
        isOptional: course.isOptional,
      })),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.roadmaps
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        apply(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, apply]);

  // Kho khóa học để kéo vào: khóa đã công khai của mọi người, cộng khóa của chính mình
  // (dùng được trong lộ trình của mình dù chưa công khai — nhưng sẽ chặn lúc gửi duyệt).
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.courses.catalogue({ limit: 100 }), api.courses.mine({ limit: 100 })])
      .then(([catalogue, mine]) => {
        if (cancelled) return;
        const seen = new Map<string, CourseListItem>();
        for (const course of [...mine.items, ...catalogue.items]) seen.set(course.id, course);
        setAvailable([...seen.values()]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<Roadmap>, done: string) => {
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

  if (error && !roadmap) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <PageHeader title="Studio lộ trình" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!roadmap || !draft) {
    return <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">Đang tải…</p>;
  }

  const locked = roadmap.status === "pending_review";
  const patch = (partial: Partial<Draft>) => setDraft({ ...draft, ...partial });

  return (
    <StudioShell
      actions={
          <div className="flex flex-wrap items-center gap-2">
            {locked ? (
              <Button
                disabled={saving}
                onClick={() => run(() => api.roadmaps.withdraw(id), "Đã hủy gửi duyệt")}
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
                    run(
                      async () => {
                        await api.roadmaps.update(id, {
                          // Chỉ gửi slug khi thực sự đổi: backend từ chối đổi slug của
                          // lộ trình đã công khai, gửi thừa là ăn 422 vô cớ.
                          ...(draft.slug !== roadmap.slug ? { slug: draft.slug } : {}),
                          title: draft.title,
                          shortDescription: draft.shortDescription || null,
                          description: draft.description || null,
                          field: draft.field,
                          level: draft.level,
                          coverImageUrl: draft.coverImageUrl || null,
                          progressionMode: draft.progressionMode,
                          prerequisiteNote: draft.prerequisiteNote || null,
                        });
                        // Danh sách sau cùng: câu trả lời của nó đã kèm `estimatedHours`
                        // vừa được backend tính lại.
                        return api.roadmaps.replaceCourses(
                          id,
                          picked.map((course) => ({
                            courseId: course.courseId,
                            isOptional: course.isOptional,
                          })),
                        );
                      },
                      "Đã lưu",
                    )
                  }
                  type="button"
                  variant="outline"
                >
                  <Save aria-hidden="true" className="size-4" />
                  {saving ? "Đang lưu…" : "Lưu"}
                </Button>
                <Button
                  disabled={saving}
                  onClick={() => run(() => api.roadmaps.submit(id), "Đã gửi duyệt")}
                  type="button"
                >
                  <Send aria-hidden="true" className="size-4" />
                  Gửi duyệt
                </Button>
              </>
            )}
          </div>
      }
      backHref="/roadmaps"
      backLabel="Lộ trình"
      error={error}
      meta={`${roadmap.courses?.length ?? 0} khóa học · ${
        roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "chưa có thời lượng"
      }`}
      notice={notice}
      rejectionReason={roadmap.rejectionReason}
      slug={roadmap.slug}
      status={
        <StatusBadge tone={CONTENT_STATUS_TONES[roadmap.status]}>
          {CONTENT_STATUS_LABELS[roadmap.status]}
        </StatusBadge>
      }
      tabs={{
        options: [
          { value: "courses", label: "Khóa học" },
          { value: "metadata", label: "Thông tin lộ trình" },
        ],
        value: tab,
        onChange: (value) => setTab(value as "courses" | "metadata"),
      }}
      title={draft.title || "Lộ trình chưa đặt tên"}
    >
      {tab === "courses" ? (
        <Group orientation="horizontal" className="h-full">
          <Panel id="picked" defaultSize="55%" minSize="25%" className="min-h-0">
            <div className="h-full overflow-y-auto p-3">
              <PickedCourses disabled={locked} onChange={setPicked} picked={picked} />
            </div>
          </Panel>

          <ResizeHandle orientation="horizontal" />

          <Panel id="library" defaultSize="45%" minSize="20%" className="min-h-0">
            <div className="h-full overflow-y-auto p-3">
              <CourseLibrary
                available={available}
                disabled={locked}
                onChange={setPicked}
                picked={picked}
              />
            </div>
          </Panel>
        </Group>
      ) : (
        <StudioScroll>
        <fieldset className="grid gap-4 lg:grid-cols-3" disabled={locked}>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Thông tin lộ trình</h2>

          <Field htmlFor="title" label="Tiêu đề">
            <input
              className={inputClassName}
              id="title"
              onChange={(event) => patch({ title: event.target.value })}
              value={draft.title}
            />
          </Field>

          <Field
            hint={
              roadmap.status === "published"
                ? "Đã công khai nên không đổi được — đường dẫn đã phát ra ngoài."
                : "Phần định danh trong đường dẫn. Chỉ đổi được khi chưa công khai."
            }
            htmlFor="slug"
            label="Slug"
          >
            <input
              className={inputClassName}
              disabled={roadmap.status === "published"}
              id="slug"
              onChange={(event) => patch({ slug: event.target.value })}
              value={draft.slug}
            />
          </Field>

          <Field htmlFor="shortDescription" hint="Một dòng hiện ở danh mục." label="Mô tả ngắn">
            <input
              className={inputClassName}
              id="shortDescription"
              onChange={(event) => patch({ shortDescription: event.target.value })}
              value={draft.shortDescription}
            />
          </Field>

          <Field htmlFor="description" hint="Bắt buộc có thì mới gửi duyệt được." label="Mô tả">
            <textarea
              className={textareaClassName}
              id="description"
              onChange={(event) => patch({ description: event.target.value })}
              value={draft.description}
            />
          </Field>

          <Field htmlFor="coverImageUrl" hint="http:// hoặc https://" label="Ảnh bìa (URL)">
            <input
              className={inputClassName}
              id="coverImageUrl"
              onChange={(event) => patch({ coverImageUrl: event.target.value })}
              placeholder="https://"
              value={draft.coverImageUrl}
            />
          </Field>

          <Field htmlFor="prerequisiteNote" label="Ghi chú điều kiện tiên quyết">
            <textarea
              className={textareaClassName}
              id="prerequisiteNote"
              onChange={(event) => patch({ prerequisiteNote: event.target.value })}
              value={draft.prerequisiteNote}
            />
          </Field>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold">Phân loại</h2>

          <Field htmlFor="field" label="Lĩnh vực">
            <select
              className={inputClassName}
              id="field"
              onChange={(event) => patch({ field: event.target.value })}
              value={draft.field}
            >
              {FIELDS.map((value) => (
                <option key={value} value={value}>
                  {FIELD_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="level" label="Trình độ đầu vào">
            <select
              className={inputClassName}
              id="level"
              onChange={(event) => patch({ level: event.target.value })}
              value={draft.level}
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
              onChange={(event) => patch({ progressionMode: event.target.value })}
              value={draft.progressionMode}
            >
              {MODES.map((value) => (
                <option key={value} value={value}>
                  {MODE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </Card>

          <div className="lg:col-span-3">
            <Button
              disabled={saving || roadmap.status === "published"}
              onClick={() =>
                run(async () => {
                  await api.roadmaps.remove(id);
                  router.push("/roadmaps");
                  return roadmap;
                }, "Đã xoá")
              }
              type="button"
              variant="ghost"
            >
              Xoá lộ trình này
            </Button>
          </div>
        </fieldset>
        </StudioScroll>
      )}
    </StudioShell>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
