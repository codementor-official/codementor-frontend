"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, ExternalLink, FileText, GripVertical, ListTree, Plus, Trash2 } from "lucide-react";
import {
  Button,
  DetailMeta,
  DetailRow,
  DetailSection,
  DrawerDetail,
  Select,
  SideDrawer,
  StatusBadge,
} from "@codementor/ui";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import { DropIndicator, dropZoneClasses, useSortableRow } from "@/components/sortable";
import type { CourseListItem } from "@/features/courses/types";
import { api } from "@/lib/api";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  LEVEL_LABELS,
  type RoadmapCourseItem,
} from "@/features/roadmaps/types";

export interface PickedCourse {
  courseId: string;
  title: string;
  status: RoadmapCourseItem["status"];
  durationHours: number | null;
  isOptional: boolean;
}

export function addCourse(picked: PickedCourse[], course: CourseListItem): PickedCourse[] {
  return [
    ...picked,
    {
      courseId: course.id,
      title: course.title,
      status: course.status,
      durationHours: course.durationHours,
      isOptional: false,
    },
  ];
}

interface Props {
  picked: PickedCourse[];
  available: CourseListItem[];
  onChange: (picked: PickedCourse[]) => void;
  disabled?: boolean;
}

/**
 * Danh sách khóa học đã chọn. `DndContext` và `sensors` giờ nằm ở trang studio — pane này
 * chỉ khai báo nó là một vùng thả được (`useDroppable`) và một `SortableContext` để tự sắp
 * xếp lại, chứ không tự mở `DndContext` riêng như trước, vì kéo từ kho sang cần MỘT context
 * bao trùm cả hai pane.
 */
export function PickedCourses({ picked, onChange, disabled }: Omit<Props, "available">) {
  const { setNodeRef, isOver } = useDroppable({ id: "picked-pane" });
  const total = picked.reduce((sum, course) => sum + (course.durationHours ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Khóa học trong lộ trình</h2>
        <span className="text-xs text-muted-foreground">
          {picked.length} khóa · {total > 0 ? `${total} giờ` : "chưa có thời lượng"}
        </span>
      </div>

      <div className={`rounded-lg border p-1 ${dropZoneClasses(isOver)}`} ref={setNodeRef}>
        {picked.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có khóa học nào. Thêm từ cột bên phải, hoặc kéo khóa học vào đây.
          </p>
        ) : (
          <SortableContext items={picked.map((course) => course.courseId)} strategy={verticalListSortingStrategy}>
            <ol className="grid gap-2">
              {picked.map((course, index) => (
                <SortablePicked
                  course={course}
                  disabled={disabled}
                  index={index}
                  key={course.courseId}
                  onRemove={() => onChange(picked.filter((item) => item.courseId !== course.courseId))}
                />
              ))}
            </ol>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

/**
 * The other half: everything not yet in the roadmap, one click away from being added.
 *
 * Searchable, filterable and paged — the library is every published course on the platform
 * plus every draft of the author's own, which was an unbounded scroll with no way to find
 * the one course you came for.
 */
export function CourseLibrary({ picked, available, onChange, disabled }: Props) {
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<CourseListItem | null>(null);

  const chosen = new Set(picked.map((course) => course.courseId));
  const rest = available.filter(
    (course) => !chosen.has(course.id) && (status === "" || course.status === status),
  );

  const list = usePagedList(
    rest,
    (course, query) =>
      `${course.title} ${course.slug}`.toLowerCase().includes(query),
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Kho khóa học</h2>
        <span className="text-xs text-muted-foreground">{list.total} khóa</span>
      </div>

      <ListSearch
        filters={
          <Select
            className="h-9"
            label="Trạng thái"
            onChange={setStatus}
            options={[
              { value: "", label: "Mọi trạng thái" },
              ...CONTENT_STATUSES.map((value) => ({
                value,
                label: CONTENT_STATUS_LABELS[value],
              })),
            ]}
            value={status}
          />
        }
        onChange={list.setQuery}
        placeholder="Tìm khóa học theo tên hoặc slug…"
        value={list.query}
      />

      {list.visible.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {rest.length === 0
            ? "Không còn khóa học nào để thêm."
            : "Không có khóa học nào khớp bộ lọc."}
        </p>
      ) : (
        <ul className="grid gap-2">
          {list.visible.map((course) => (
            <DraggableCourse
              course={course}
              disabled={disabled}
              key={course.id}
              onAdd={() => onChange(addCourse(picked, course))}
              onOpen={() => setSelected(course)}
            />
          ))}
        </ul>
      )}

      <ListPager
        onChange={list.setPage}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        unit="khóa học"
      />

      {selected && <CourseDrawer course={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SortablePicked({
  course,
  index,
  disabled,
  onRemove,
}: {
  course: PickedCourse;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const { setNodeRef, style, handleProps, className, dropEdge } = useSortableRow({
    id: course.courseId,
    disabled,
  });

  return (
    <li
      className={`relative flex items-center gap-2 rounded-lg border bg-card px-3 py-2 ${className}`}
      ref={setNodeRef}
      style={style}
    >
      <DropIndicator edge={dropEdge} />
      <button
        aria-label="Kéo để đổi thứ tự khóa học"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        type="button"
        {...handleProps}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {index + 1}. {course.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"}
        </p>
      </div>


      {/* Lộ trình chỉ gửi duyệt được khi mọi khóa học đã công khai — hiện trạng thái
          ngay ở đây để tác giả thấy vướng chỗ nào trước khi bấm gửi. */}
      <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
        {CONTENT_STATUS_LABELS[course.status]}
      </StatusBadge>

      <button
        aria-label="Bỏ khỏi lộ trình"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  );
}

/**
 * Một dòng trong kho, kéo được sang pane lộ trình. Không `useSortable` — kho không tự sắp
 * xếp lại, nó chỉ là nguồn cho một cú thả.
 */
function DraggableCourse({
  course,
  disabled,
  onAdd,
  onOpen,
}: {
  course: CourseListItem;
  disabled?: boolean;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${course.id}`,
    disabled,
  });

  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
        isDragging ? "opacity-40" : ""
      }`}
      ref={setNodeRef}
    >
      <button
        aria-label={`Kéo ${course.title} vào lộ trình`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        type="button"
        {...attributes}
        {...listeners}
        onClick={onOpen}
      >
        <GripVertical aria-hidden="true" className="size-4 shrink-0 cursor-grab text-muted-foreground" />
        <span className="min-w-0">
          <p className="truncate text-sm font-medium">{course.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {course.authorName ?? "Chưa rõ tác giả"} · {course.totalChapters} chương · {course.totalLessons} bài
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {course.durationHours ? `${course.durationHours} giờ · ` : "Chưa có thời lượng · "}
            {CONTENT_STATUS_LABELS[course.status]}
          </p>
        </span>
      </button>
      <Button aria-label={`Thêm ${course.title}`} disabled={disabled} onClick={onAdd} size="sm" type="button" variant="outline">
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
    </li>
  );
}

function CourseDrawer({ course, onClose }: { course: CourseListItem; onClose: () => void }) {
  const router = useRouter();

  return (
    <SideDrawer
      footer={
        <Button onClick={() => router.push(`/courses/${course.id}/studio`)} type="button">
          <ExternalLink aria-hidden="true" className="size-4" />
          Mở studio
        </Button>
      }
      onClose={onClose}
      open
      title={course.title}
      width="default"
    >
      <DrawerDetail key={course.id} load={() => api.courses.get(course.id)}>
        {(detail) => (
          <>
            <DetailMeta>
              <DetailRow label="Tác giả" value={course.authorName ?? "Chưa rõ tác giả"} />
              <DetailRow label="Trình độ" value={LEVEL_LABELS[detail.level]} />
              <DetailRow label="Nội dung" value={`${detail.totalChapters} chương · ${detail.totalLessons} bài`} />
              <DetailRow
                label="Thời lượng"
                value={detail.durationHours ? `${detail.durationHours} giờ` : "Chưa có"}
              />
              <DetailRow label="Trạng thái" value={<StatusBadge tone={CONTENT_STATUS_TONES[detail.status]}>{CONTENT_STATUS_LABELS[detail.status]}</StatusBadge>} />
              <DetailRow label="Slug" value={detail.slug} />
            </DetailMeta>

            {detail.description && (
              <DetailSection icon={FileText} title="Mô tả">
                <p className="text-sm leading-relaxed">{detail.description}</p>
              </DetailSection>
            )}

            <DetailSection icon={ListTree} title="Chương trình học">
              {(detail.chapters?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Khóa học chưa có chương nào.</p>
              ) : (
                <ol className="grid gap-2">
                  {detail.chapters?.map((chapter, index) => (
                    <li className="rounded-md border" key={chapter.id ?? chapter.title}>
                      <div className="flex items-baseline gap-2 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {index + 1}. {chapter.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {chapter.lessons.length} bài
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </DetailSection>

            <DetailSection icon={BookOpen} title="Thông tin thêm">
              <p className="text-sm text-muted-foreground">
                Mở studio để chỉnh sửa thông tin, chương học và bài học của khóa học.
              </p>
            </DetailSection>
          </>
        )}
      </DrawerDetail>
    </SideDrawer>
  );
}
