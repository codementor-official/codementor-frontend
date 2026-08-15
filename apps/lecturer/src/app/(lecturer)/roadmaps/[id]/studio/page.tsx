"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Button, Card, StatusBadge } from "@codementor/ui";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { PageHeader } from "@/components/page/page-header";
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

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.roadmaps
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        setRoadmap(loaded);
        setDraft(toDraft(loaded));
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const run = async (action: () => Promise<Roadmap>, done: string) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await action();
      setRoadmap(updated);
      setDraft(toDraft(updated));
      setNotice(done);
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  if (error && !roadmap) {
    return (
      <>
        <PageHeader title="Studio lộ trình" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </>
    );
  }

  if (!roadmap || !draft) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  const locked = roadmap.status === "pending_review";
  const patch = (partial: Partial<Draft>) => setDraft({ ...draft, ...partial });

  return (
    <>
      <Link
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        href="/roadmaps"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Lộ trình
      </Link>

      <PageHeader
        action={
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
                      () =>
                        api.roadmaps.update(id, {
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
                        }),
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
        description={roadmap.slug}
        title={draft.title || "Lộ trình chưa đặt tên"}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge tone={CONTENT_STATUS_TONES[roadmap.status]}>
          {CONTENT_STATUS_LABELS[roadmap.status]}
        </StatusBadge>
        <span className="text-sm text-muted-foreground">
          {roadmap.courses?.length ?? 0} khóa học ·{" "}
          {roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "chưa có thời lượng"}
        </span>
        {locked && (
          <span className="text-sm text-muted-foreground">
            Đang chờ duyệt nên không sửa được.
          </span>
        )}
      </div>

      {roadmap.rejectionReason && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Lý do bị trả về: {roadmap.rejectionReason}
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
      </fieldset>

      <Card className="mt-4 p-5">
        <h2 className="mb-1 text-sm font-semibold">Khóa học trong lộ trình</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Thời lượng lộ trình là tổng thời lượng các khóa học ở đây, hệ thống tự tính sau mỗi
          lần lưu.
        </p>

        {(roadmap.courses?.length ?? 0) === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có khóa học nào. Phần kéo thả sẽ mở khi màn quản lý khóa học hoàn thiện.
          </p>
        ) : (
          <ol className="grid gap-2">
            {roadmap.courses?.map((course) => (
              <li
                className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                key={course.courseId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {course.position}. {course.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"}
                    {course.isOptional && " · tùy chọn"}
                  </p>
                </div>
                <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
                  {CONTENT_STATUS_LABELS[course.status]}
                </StatusBadge>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="mt-6 flex justify-end">
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
