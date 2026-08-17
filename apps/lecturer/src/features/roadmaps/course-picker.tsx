"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button, Select, StatusBadge } from "@codementor/ui";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import { DropIndicator, SortableOverlay, useSortableRow } from "@/components/sortable";
import type { CourseListItem } from "@/features/courses/types";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  type RoadmapCourseItem,
} from "@/features/roadmaps/types";

export interface PickedCourse {
  courseId: string;
  title: string;
  status: RoadmapCourseItem["status"];
  durationHours: number | null;
  isOptional: boolean;
}

interface Props {
  picked: PickedCourse[];
  available: CourseListItem[];
  onChange: (picked: PickedCourse[]) => void;
  disabled?: boolean;
}

/**
 * Danh sách khóa học đã chọn, kéo để sắp thứ tự.
 *
 * Thứ tự trong lộ trình là thứ tự mảng — backend không nhận `position` từ client, vì
 * client gửi vị trí lệch nhau là đụng `UNIQUE(roadmap_id, position)`.
 *
 * Tách khỏi kho khóa học (`CourseLibrary` bên dưới) thay vì hai cột trong cùng một lưới:
 * studio đặt mỗi bên vào một pane kéo được, mà một lưới cố định thì không chia được.
 */
export function PickedCourses({ picked, onChange, disabled }: Omit<Props, "available">) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = picked.findIndex((course) => course.courseId === active.id);
    const to = picked.findIndex((course) => course.courseId === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(picked, from, to));
  };

  const total = picked.reduce((sum, course) => sum + (course.durationHours ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Khóa học trong lộ trình</h2>
          <span className="text-xs text-muted-foreground">
            {picked.length} khóa · {total > 0 ? `${total} giờ` : "chưa có thời lượng"}
          </span>
        </div>

        {picked.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có khóa học nào. Thêm từ cột bên phải.
          </p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext
              items={picked.map((course) => course.courseId)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="grid gap-2">
                {picked.map((course, index) => (
                  <SortablePicked
                    course={course}
                    disabled={disabled}
                    index={index}
                    key={course.courseId}
                    onRemove={() =>
                      onChange(picked.filter((item) => item.courseId !== course.courseId))
                    }
                    onToggleOptional={() =>
                      onChange(
                        picked.map((item) =>
                          item.courseId === course.courseId
                            ? { ...item, isOptional: !item.isOptional }
                            : item,
                        ),
                      )
                    }
                  />
                ))}
              </ol>
            </SortableContext>

            <SortableOverlay>
              {(activeId) => {
                const course = picked.find((item) => item.courseId === activeId);
                return course ? (
                  <p className="px-3 py-2 text-sm font-medium">{course.title}</p>
                ) : null;
              }}
            </SortableOverlay>
          </DndContext>
      )}
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

  const chosen = new Set(picked.map((course) => course.courseId));
  const rest = available.filter(
    (course) => !chosen.has(course.id) && (status === "" || course.status === status),
  );

  const list = usePagedList(
    rest,
    (course, query) =>
      `${course.title} ${course.slug}`.toLowerCase().includes(query),
  );

  const add = (course: CourseListItem) =>
    onChange([
      ...picked,
      {
        courseId: course.id,
        title: course.title,
        status: course.status,
        durationHours: course.durationHours,
        isOptional: false,
      },
    ]);

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
            <li
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              key={course.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{course.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {course.durationHours ? `${course.durationHours} giờ · ` : ""}
                  {CONTENT_STATUS_LABELS[course.status]}
                </p>
              </div>
              <Button
                aria-label={`Thêm ${course.title}`}
                disabled={disabled}
                onClick={() => add(course)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </Button>
            </li>
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
    </div>
  );
}

function SortablePicked({
  course,
  index,
  disabled,
  onRemove,
  onToggleOptional,
}: {
  course: PickedCourse;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  onToggleOptional: () => void;
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

      <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <input
          checked={course.isOptional}
          className="size-3.5 accent-primary"
          disabled={disabled}
          onChange={onToggleOptional}
          type="checkbox"
        />
        tùy chọn
      </label>

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
