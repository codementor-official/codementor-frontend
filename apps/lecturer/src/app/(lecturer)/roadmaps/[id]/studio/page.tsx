"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Info, Save, Send, Tags, TriangleAlert, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Group, Panel } from "react-resizable-panels";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  BreadcrumbTitle,
  Button,
  Card,
  Modal,
  PageHeader,
  ResizeHandle,
  StatusBadge,
  useToast,
  useUndoableDelete,
} from "@codementor/ui";
import { CardHeading } from "@/components/page/card-heading";
import { DangerZone } from "@/components/page/danger-zone";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
import { SortableOverlay } from "@/components/sortable";
import { addCourse, CourseLibrary, PickedCourses, type PickedCourse } from "@/features/roadmaps/course-picker";
import type { CourseListItem } from "@/features/courses/types";
import { api } from "@/lib/api";
import { isClean, slug as slugRule, text, url, type FieldError } from "@codementor/utils";
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

/** Chữ ký của bản nháp: thông tin lộ trình cộng danh sách khóa học theo đúng thứ tự. */
function signature(draft: Draft, picked: PickedCourse[]): string {
  return JSON.stringify([draft, picked.map((course) => [course.courseId, course.isOptional])]);
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

  const toast = useToast();
  const [tab, setTab] = useState<"courses" | "metadata">("courses");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picked, setPicked] = useState<PickedCourse[]>([]);
  const [available, setAvailable] = useState<CourseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { scheduleDelete } = useUndoableDelete();
  // Nháp phát hiện trong localStorage lúc mở trang, còn chờ người dùng chọn khôi phục
  // hay bỏ qua — xem effect nạp lộ trình bên dưới và ô thoại render ở cuối component.
  const [pendingDraft, setPendingDraft] = useState<StoredDraft<{ draft: Draft; picked: PickedCourse[] }> | null>(null);

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

        const freshDraft = toDraft(loaded);
        const freshPicked: PickedCourse[] = (loaded.courses ?? []).map((course) => ({
          courseId: course.courseId,
          title: course.title,
          status: course.status,
          durationHours: course.durationHours,
          isOptional: course.isOptional,
        }));
        const stored = readDraft<{ draft: Draft; picked: PickedCourse[] }>(draftStorageKey("roadmap", id));
        if (!stored) return;
        if (signature(stored.value.draft, stored.value.picked) === signature(freshDraft, freshPicked)) {
          clearDraft(draftStorageKey("roadmap", id));
        } else {
          setPendingDraft(stored);
        }
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
    try {
      apply(await action());
      toast.success(done);
    } catch (cause) {
      // Lỗi của một thao tác đi bằng toast; `error` chỉ còn giữ lỗi tải trang, thứ khiến
      // màn hình không vẽ được gì.
      toast.error(describe(cause));
    } finally {
      setSaving(false);
    }
  };

  // Trước early return: hook phải chạy ở mọi lần render.
  const dirty =
    Boolean(roadmap && draft) &&
    signature(draft as Draft, picked) !==
      signature(
        toDraft(roadmap as Roadmap),
        ((roadmap as Roadmap).courses ?? []).map((course) => ({
          courseId: course.courseId,
          title: course.title,
          status: course.status,
          durationHours: course.durationHours,
          isOptional: course.isOptional,
        })),
      );
  useDraftAutosave(draftStorageKey("roadmap", id), { draft: draft as Draft, picked }, {
    ready: Boolean(roadmap && draft),
    dirty,
  });
  const unsavedDialog = useUnsavedGuard(dirty);
  // Cũng phải chạy trước early return — dùng ở DndContext bên dưới, sau chỗ trang có thể
  // return sớm khi đang tải hoặc lỗi.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  // Cùng giới hạn mà `UpdateRoadmapDto` áp ở backend — form chặn sớm, backend vẫn là nơi quyết.
  const errors: Record<string, FieldError> = {
    title: text(draft.title, 200, "Tiêu đề"),
    slug: slugRule(draft.slug),
    shortDescription:
      draft.shortDescription.trim().length > 500 ? "Mô tả ngắn tối đa 500 ký tự" : undefined,
    description: draft.description.trim().length > 5000 ? "Mô tả tối đa 5000 ký tự" : undefined,
    coverImageUrl: url(draft.coverImageUrl, "Ảnh bìa"),
    prerequisiteNote:
      draft.prerequisiteNote.trim().length > 1000 ? "Ghi chú tối đa 1000 ký tự" : undefined,
  };
  const blocker = isClean(errors) ? undefined : "Còn ô chưa hợp lệ ở thông tin lộ trình";

  /**
   * `closestCenter` không phân biệt vùng thả cha (pane) với hàng con của chính nó — cả hai
   * cùng đăng ký droppable, nên một cú kéo-sắp-xếp-lại gần tâm pane có thể trúng nhầm pane
   * thay vì đúng hàng. Lọc trước theo nguồn kéo: kéo để sắp xếp lại thì loại "picked-pane" ra,
   * chỉ để các hàng cạnh tranh với nhau — giống cách curriculum-tree.tsx lọc theo chương/bài.
   *
   * Kéo từ kho thì KHÔNG dùng `closestCenter`: với đúng một candidate ("picked-pane"), nó luôn
   * trả candidate đó bất kể con trỏ đang ở đâu — thả ở bất kỳ đâu cũng bị tính là thả vào pane,
   * và highlight "rê tới để thả" của pane bật sáng suốt lúc kéo thay vì chỉ lúc rê tới. Dùng
   * `pointerWithin` — trả rỗng khi con trỏ thực sự chưa nằm trong pane, đúng nghĩa "đã thả vào".
   */
  const collisionDetection: CollisionDetection = (args) => {
    if (String(args.active.id).startsWith("pool:")) {
      return pointerWithin({
        ...args,
        droppableContainers: args.droppableContainers.filter((container) => container.id === "picked-pane"),
      });
    }
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => container.id !== "picked-pane"),
    });
  };

  /**
   * Một `DndContext` cho cả hai pane: kéo từ "Kho khóa học" thả VÀO BẤT KỲ ĐÂU trong pane lộ
   * trình thì thêm vào cuối (giống hệt nút "+"); kéo trong pane lộ trình thì vẫn là sắp xếp
   * lại như trước. Chỉ "Kho khóa học" đăng ký `useDroppable`/`useDraggable`, nên `over` khác
   * null LUÔN LUÔN thuộc phía lộ trình — không cần kiểm thêm over.id.
   */
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const activeId = String(active.id);

    if (activeId.startsWith("pool:")) {
      const courseId = activeId.slice("pool:".length);
      const course = available.find((item) => item.id === courseId);
      if (!course || picked.some((item) => item.courseId === courseId)) return;
      setPicked(addCourse(picked, course));
      return;
    }

    if (active.id === over.id) return;
    const from = picked.findIndex((course) => course.courseId === active.id);
    const to = picked.findIndex((course) => course.courseId === over.id);
    if (from < 0 || to < 0) return;
    setPicked(arrayMove(picked, from, to));
  };

  return (
    <>
    {unsavedDialog}
    <BreadcrumbTitle href={`/roadmaps?open=${id}`} slug={id} title={draft.title || roadmap.slug} />
    <Modal
      description={
        pendingDraft
          ? `Bản nháp từ ${new Date(pendingDraft.savedAt).toLocaleString("vi-VN")}, chưa kịp lưu vào hệ thống.`
          : undefined
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              clearDraft(draftStorageKey("roadmap", id));
              setPendingDraft(null);
            }}
            type="button"
            variant="outline"
          >
            Bỏ qua
          </Button>
          <Button
            onClick={() => {
              if (!pendingDraft) return;
              setDraft(pendingDraft.value.draft);
              setPicked(pendingDraft.value.picked);
              setPendingDraft(null);
            }}
            type="button"
          >
            Khôi phục thay đổi
          </Button>
        </div>
      }
      onClose={() => {
        clearDraft(draftStorageKey("roadmap", id));
        setPendingDraft(null);
      }}
      open={pendingDraft !== null}
      title="Phát hiện thay đổi chưa lưu"
      width="sm"
    >
      <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
        Trang có vẻ đã bị tải lại hoặc mất mạng trước khi kịp lưu. Khôi phục để tiếp tục từ
        chỗ đang dở, hoặc bỏ qua để dùng đúng bản đã lưu trên hệ thống.
      </p>
    </Modal>
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
                  disabled={saving || blocker !== undefined}
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
                  title={blocker}
                  type="button"
                  variant="outline"
                >
                  <Save aria-hidden="true" className="size-4" />
                  {saving ? "Đang lưu…" : "Lưu"}
                </Button>
                <Button
                  disabled={saving || blocker !== undefined}
                  onClick={() => run(() => api.roadmaps.submit(id), "Đã gửi duyệt")}
                  title={blocker}
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
      meta={`${roadmap.courses?.length ?? 0} khóa học · ${
        roadmap.estimatedHours ? `${roadmap.estimatedHours} giờ` : "chưa có thời lượng"
      }`}
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
        <DndContext collisionDetection={collisionDetection} onDragEnd={onDragEnd} sensors={sensors}>
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
          <RoadmapDragOverlay available={available} picked={picked} />
        </DndContext>
      ) : (
        <StudioScroll>
        <fieldset className="grid gap-4 lg:grid-cols-3" disabled={locked}>
        <Card className="p-5 lg:col-span-2">
          <CardHeading
            hint="Những gì học viên đọc thấy ở trang lộ trình và ở danh mục. Tiêu đề và mô tả là hai trường bắt buộc để gửi duyệt."
            icon={Info}
            title="Thông tin lộ trình"
          />

          <Field error={errors.title}
            htmlFor="title" label="Tiêu đề">
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
            error={errors.slug}
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

          <Field error={errors.shortDescription}
            htmlFor="shortDescription" hint="Một dòng hiện ở danh mục." label="Mô tả ngắn">
            <input
              className={inputClassName}
              id="shortDescription"
              onChange={(event) => patch({ shortDescription: event.target.value })}
              value={draft.shortDescription}
            />
          </Field>

          <Field error={errors.description}
            htmlFor="description" hint="Bắt buộc có thì mới gửi duyệt được." label="Mô tả">
            <textarea
              className={textareaClassName}
              id="description"
              onChange={(event) => patch({ description: event.target.value })}
              value={draft.description}
            />
          </Field>

          <Field error={errors.coverImageUrl}
            htmlFor="coverImageUrl" hint="http:// hoặc https://" label="Ảnh bìa (URL)">
            <input
              className={inputClassName}
              id="coverImageUrl"
              onChange={(event) => patch({ coverImageUrl: event.target.value })}
              placeholder="https://"
              value={draft.coverImageUrl}
            />
          </Field>

          <Field error={errors.prerequisiteNote}
            htmlFor="prerequisiteNote" label="Ghi chú điều kiện tiên quyết">
            <textarea
              className={textareaClassName}
              id="prerequisiteNote"
              onChange={(event) => patch({ prerequisiteNote: event.target.value })}
              value={draft.prerequisiteNote}
            />
          </Field>
        </Card>

        <Card className="h-fit p-5">
          <CardHeading
            hint="Quyết định lộ trình xuất hiện ở bộ lọc nào và học viên phải học theo thứ tự ra sao."
            icon={Tags}
            title="Phân loại"
          />

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


        </Card>

          <div className="mt-6 border-t border-border pt-6 lg:col-span-3">
            <DangerZone
              actionLabel="Xoá lộ trình này"
              confirmDescription={`Lộ trình “${draft.title || roadmap.slug}” sẽ bị xoá khỏi hệ thống cùng danh sách khóa học bên trong. Bản thân các khóa học vẫn còn. Có vài giây để hoàn tác sau khi xác nhận.`}
              confirmTitle="Xoá lộ trình này?"
              description={
                roadmap.status === "published"
                  ? "Lộ trình đã công khai thì không xoá được — học viên đang theo nó. Gỡ công khai trước."
                  : "Xoá lộ trình này khỏi hệ thống. Danh sách khóa học bên trong sẽ mất, các khóa học thì vẫn còn. Có vài giây để hoàn tác sau khi xác nhận."
              }
              disabled={saving || roadmap.status === "published"}
              onConfirm={() => {
                scheduleDelete({
                  id,
                  message: `Đã xoá lộ trình "${draft.title || roadmap.slug}".`,
                  commit: () => api.roadmaps.remove(id),
                });
                router.push("/roadmaps");
              }}
              title="Xoá lộ trình"
            />
          </div>
        </fieldset>
        </StudioScroll>
      )}
    </StudioShell>
    </>
  );
}

function RoadmapDragOverlay({ picked, available }: { picked: PickedCourse[]; available: CourseListItem[] }) {
  return (
    <SortableOverlay>
      {(activeId) => {
        if (activeId.startsWith("pool:")) {
          const course = available.find((item) => item.id === activeId.slice("pool:".length));
          return course ? <p className="px-3 py-2 text-sm font-medium">{course.title}</p> : null;
        }
        const course = picked.find((item) => item.courseId === activeId);
        return course ? <p className="px-3 py-2 text-sm font-medium">{course.title}</p> : null;
      }}
    </SortableOverlay>
  );
}

function describe(cause: unknown): string {
  if (cause instanceof ApiClientError) {
    const body = cause.body as { message?: string } | undefined;
    return body?.message ?? cause.message;
  }
  return cause instanceof Error ? cause.message : "Thao tác thất bại";
}
