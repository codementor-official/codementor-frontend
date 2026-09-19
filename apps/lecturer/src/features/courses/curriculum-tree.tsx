"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDndContext,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Braces, ChevronDown, ChevronRight, FileText, GripVertical, PlayCircle, Plus, Trash2, Unlock } from "lucide-react";
import { Button, Modal } from "@codementor/ui";
import {
  DropIndicator,
  SortableOverlay,
  dropZoneClasses,
  useSortableRow,
} from "@/components/sortable";
import {
  LESSON_TYPE_LABELS,
  bearsExercise,
  newKey,
  type DraftChapter,
  type DraftLesson,
} from "@/features/courses/types";

export type Selection =
  | { kind: "chapter"; chapterKey: string }
  | { kind: "lesson"; chapterKey: string; lessonKey: string }
  | null;

interface Props {
  chapters: DraftChapter[];
  onChange: (chapters: DraftChapter[]) => void;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  disabled?: boolean;
}

/**
 * Cây chương và bài, kéo thả bằng @dnd-kit.
 *
 * Kéo bài giữa các chương KHÔNG được sinh key hay id mới: `id` là thứ giữ cho tiến độ
 * học viên khỏi bị xoá khi lưu, nên mọi thao tác sắp xếp chỉ di chuyển object có sẵn.
 *
 * Một `SortableContext` cho danh sách chương, và một cho mỗi chương. Bài mang `data`
 * chỉ ra chương đang chứa nó, nhờ đó thả sang chương khác biết được nguồn và đích.
 */
export function CurriculumTree({ chapters, onChange, selection, onSelect, disabled }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ x: number; y: number; chapterKey?: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    | { kind: "chapter"; chapterKey: string; title: string }
    | { kind: "lesson"; chapterKey: string; lessonKey: string; title: string }
    | null
  >(null);

  /**
   * While a lesson is in flight, chapters are only candidates when they are empty.
   *
   * A chapter's sortable node spans its whole card, lesson rows included, so plain
   * `closestCenter` kept picking the chapter over the lesson the cursor was actually on —
   * the drop line then appeared at the top of the chapter instead of between two lessons.
   * An empty chapter has no lesson to hit, so it stays eligible; that is the case
   * `onDragEnd` handles by reading the chapter key off `over.id`.
   */
  const collisionDetection = useCallback(
    (args: Parameters<CollisionDetection>[0]) => {
      const draggingLesson = args.active.data.current?.chapterKey !== undefined;
      const chapterKeys = new Set(chapters.map((chapter) => chapter.key));

      if (!draggingLesson) {
        // Symmetric to the lesson-drag filter below: a chapter's own sortable node spans
        // its whole card, lesson rows included, so an UNFILTERED closestCenter resolves a
        // chapter drop onto whichever lesson row the cursor happens to be nearest — a
        // lesson key `over.id` that `onDragEnd`'s chapter branch can't match against
        // `chapters`, so the drop silently no-ops. Chapters only ever reorder against
        // other chapters, so lesson rows are never valid targets here at all.
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            chapterKeys.has(String(container.id)),
          ),
        });
      }

      const emptyChapterKeys = new Set(
        chapters.filter((chapter) => chapter.lessons.length === 0).map((chapter) => chapter.key),
      );

      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) =>
            !chapterKeys.has(String(container.id)) || emptyChapterKeys.has(String(container.id)),
        ),
      });
    },
    [chapters],
  );

  const sensors = useSensors(
    // Ngưỡng 6px: không có nó thì mỗi cú click để chọn mục đều bị hiểu là bắt đầu kéo.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const addChapter = () => {
    const chapter: DraftChapter = {
      key: newKey("ch"),
      title: `Chương ${chapters.length + 1}`,
      description: "",
      isOptional: false,
      lessons: [],
    };
    onChange([...chapters, chapter]);
    onSelect({ kind: "chapter", chapterKey: chapter.key });
    setMenu(null);
  };

  const addLesson = (chapterKey: string, type: DraftLesson["type"]) => {
    const lesson: DraftLesson = {
      key: newKey("ls"),
      title: type === "exercise" ? "Ô bài code" : "Bài học mới",
      type,
      durationMinutes: "10",
      isPreview: false,
      isOptional: false,
      exerciseId: null,
      exerciseTitle: null,
      contentRef: null,
    };
    onChange(
      chapters.map((chapter) =>
        chapter.key === chapterKey ? { ...chapter, lessons: [...chapter.lessons, lesson] } : chapter,
      ),
    );
    onSelect({ kind: "lesson", chapterKey, lessonKey: lesson.key });
    setMenu(null);
  };

  const removeChapter = (chapterKey: string) => {
    onChange(chapters.filter((chapter) => chapter.key !== chapterKey));
    onSelect(null);
    setMenu(null);
  };

  const removeLesson = (chapterKey: string, lessonKey: string) => {
    onChange(
      chapters.map((chapter) =>
        chapter.key === chapterKey
          ? { ...chapter, lessons: chapter.lessons.filter((lesson) => lesson.key !== lessonKey) }
          : chapter,
      ),
    );
    onSelect(null);
  };

  /**
   * Xoá chương/bài không lùi lại được — kéo thả sai vị trí thì còn "Ctrl+Z" trong đầu
   * người dùng (bấm lại là về), xoá nhầm thì mất thật. Cả hai đường bấm (nút trên hàng,
   * mục trong menu chuột phải) đều đi qua đây thay vì gọi thẳng `removeChapter`/
   * `removeLesson`, nên chỉ có MỘT hộp xác nhận cho cả cây.
   */
  const requestRemoveChapter = (chapterKey: string) => {
    const chapter = chapters.find((item) => item.key === chapterKey);
    setConfirmDelete({
      kind: "chapter",
      chapterKey,
      title: chapter?.title || "Chương chưa đặt tên",
    });
  };

  const requestRemoveLesson = (chapterKey: string, lessonKey: string) => {
    const lesson = chapters
      .find((item) => item.key === chapterKey)
      ?.lessons.find((item) => item.key === lessonKey);
    setConfirmDelete({
      kind: "lesson",
      chapterKey,
      lessonKey,
      title: lesson?.title || "Bài chưa đặt tên",
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeChapterKey = active.data.current?.chapterKey as string | undefined;

    // Kéo chương
    if (!activeChapterKey) {
      const from = chapters.findIndex((chapter) => chapter.key === active.id);
      const to = chapters.findIndex((chapter) => chapter.key === over.id);
      if (from < 0 || to < 0 || from === to) return;
      onChange(arrayMove(chapters, from, to));
      return;
    }

    // Kéo bài. Đích có thể là một bài khác, hoặc chính vùng của một chương (thả vào
    // chương rỗng).
    const overChapterKey = (over.data.current?.chapterKey as string | undefined) ?? String(over.id);
    const source = chapters.find((chapter) => chapter.key === activeChapterKey);
    const target = chapters.find((chapter) => chapter.key === overChapterKey);
    if (!source || !target) return;

    const fromIndex = source.lessons.findIndex((candidate) => candidate.key === active.id);
    if (fromIndex < 0) return;
    const lesson = source.lessons[fromIndex];

    // Cùng chương: đây là đổi chỗ, không phải chuyển. Gỡ ra rồi chèn vào vị trí của bài
    // đích sẽ sai khi kéo XUỐNG — sau khi gỡ, mọi bài phía sau lùi một bậc nên bài
    // được kéo rơi lại đúng chỗ cũ. `arrayMove` tính trên mảng chưa gỡ nên không bị.
    if (source.key === target.key) {
      const toIndex = source.lessons.findIndex((candidate) => candidate.key === over.id);
      if (toIndex < 0 || toIndex === fromIndex) return;
      onChange(
        chapters.map((chapter) =>
          chapter.key === source.key
            ? { ...chapter, lessons: arrayMove(chapter.lessons, fromIndex, toIndex) }
            : chapter,
        ),
      );
      return;
    }

    const next = chapters.map((chapter) =>
      chapter.key === source.key
        ? { ...chapter, lessons: chapter.lessons.filter((item) => item.key !== lesson.key) }
        : chapter,
    );

    const targetIndex = next.findIndex((chapter) => chapter.key === target.key);
    const lessons = [...next[targetIndex].lessons];
    const overIndex = lessons.findIndex((item) => item.key === over.id);
    lessons.splice(overIndex < 0 ? lessons.length : overIndex, 0, lesson);
    next[targetIndex] = { ...next[targetIndex], lessons };

    onChange(next);
  };

  return (
    <div
      className="relative"
      onContextMenu={(event) => {
        if (disabled) return;
        event.preventDefault();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Nội dung khóa học</h2>
        <Button disabled={disabled} onClick={addChapter} size="sm" type="button" variant="outline">
          <Plus aria-hidden="true" className="size-3.5" />
          Chương
        </Button>
      </div>

      {chapters.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Chưa có chương nào. Bấm “Chương”, hoặc chuột phải để mở menu.
        </p>
      ) : (
        <DndContext collisionDetection={collisionDetection} onDragEnd={onDragEnd} sensors={sensors}>
          <SortableContext
            items={chapters.map((chapter) => chapter.key)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="grid gap-2">
              {chapters.map((chapter, index) => (
                <SortableChapter
                  chapter={chapter}
                  collapsed={collapsed.has(chapter.key)}
                  disabled={disabled}
                  index={index}
                  key={chapter.key}
                  onAddLesson={addLesson}
                  onContextMenu={(x, y) => setMenu({ x, y, chapterKey: chapter.key })}
                  onRemoveChapter={requestRemoveChapter}
                  onRemoveLesson={requestRemoveLesson}
                  onSelect={onSelect}
                  onToggle={toggle}
                  selection={selection}
                />
              ))}
            </ul>
          </SortableContext>

          <SortableOverlay>{(activeId) => <DragPreview activeId={activeId} chapters={chapters} />}</SortableOverlay>
        </DndContext>
      )}

      {menu && (
        <>
          <button
            aria-label="Đóng menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setMenu(null)}
            type="button"
          />
          <div
            className="fixed z-50 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            role="menu"
            style={{ left: menu.x, top: menu.y }}
          >
            <MenuItem onClick={addChapter}>Tạo chương mới</MenuItem>
            {menu.chapterKey && (
              <>
                <MenuItem onClick={() => addLesson(menu.chapterKey!, "article")}>
                  Thêm bài lý thuyết
                </MenuItem>
                <MenuItem onClick={() => addLesson(menu.chapterKey!, "exercise")}>
                  Thêm ô bài code
                </MenuItem>
                <MenuItem onClick={() => requestRemoveChapter(menu.chapterKey!)}>
                  Xoá chương này
                </MenuItem>
              </>
            )}
          </div>
        </>
      )}

      <Modal
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmDelete(null)} type="button" variant="outline">
              Huỷ
            </Button>
            <Button
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.kind === "chapter") removeChapter(confirmDelete.chapterKey);
                else removeLesson(confirmDelete.chapterKey, confirmDelete.lessonKey);
                setConfirmDelete(null);
              }}
              type="button"
              variant="danger"
            >
              Xoá
            </Button>
          </div>
        }
        onClose={() => setConfirmDelete(null)}
        open={confirmDelete !== null}
        title={confirmDelete?.kind === "chapter" ? "Xoá chương này?" : "Xoá bài này?"}
        width="sm"
      >
        <p className="text-sm text-muted-foreground">
          {confirmDelete?.kind === "chapter"
            ? `Chương "${confirmDelete.title}" và toàn bộ bài bên trong sẽ bị xoá. Không hoàn tác được.`
            : `Bài "${confirmDelete?.title}" sẽ bị xoá. Không hoàn tác được.`}
        </p>
      </Modal>
    </div>
  );
}

/** What rides under the cursor: the title of whichever chapter or lesson is in flight. */
function DragPreview({ activeId, chapters }: { activeId: string; chapters: DraftChapter[] }) {
  const chapter = chapters.find((candidate) => candidate.key === activeId);
  if (chapter) {
    return (
      <p className="px-3 py-2 text-sm font-medium">
        {chapter.title || "Chương chưa đặt tên"}
        <span className="ml-2 text-xs text-muted-foreground">{chapter.lessons.length} bài</span>
      </p>
    );
  }

  for (const candidate of chapters) {
    const lesson = candidate.lessons.find((item) => item.key === activeId);
    if (!lesson) continue;
    const Icon = bearsExercise(lesson.type) ? Braces : lesson.type === "video" ? PlayCircle : FileText;
    return (
      <p className="flex items-center gap-1.5 px-3 py-2 text-sm">
        <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        {lesson.title || "Bài chưa đặt tên"}
      </p>
    );
  }
  return null;
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button className="w-full justify-start" onClick={onClick} role="menuitem" size="sm" variant="ghost">
      {children}
    </Button>
  );
}

function SortableChapter({
  chapter,
  index,
  collapsed,
  selection,
  disabled,
  onSelect,
  onToggle,
  onAddLesson,
  onRemoveChapter,
  onRemoveLesson,
  onContextMenu,
}: {
  chapter: DraftChapter;
  index: number;
  collapsed: boolean;
  selection: Selection;
  disabled?: boolean;
  onSelect: (selection: Selection) => void;
  onToggle: (key: string) => void;
  onAddLesson: (chapterKey: string, type: DraftLesson["type"]) => void;
  onRemoveChapter: (chapterKey: string) => void;
  onRemoveLesson: (chapterKey: string, lessonKey: string) => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const { setNodeRef, style, handleProps, className, dropEdge } = useSortableRow({
    id: chapter.key,
    disabled,
  });
  const active = selection?.kind === "chapter" && selection.chapterKey === chapter.key;

  return (
    <li
      className={`relative rounded-lg border bg-card ${className}`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) onContextMenu(event.clientX, event.clientY);
      }}
      ref={setNodeRef}
      style={style}
    >
      <DropIndicator edge={dropEdge} />
      <div className={`flex items-center gap-1.5 px-2 py-2 ${active ? "bg-muted" : ""}`}>
        <button
          aria-label="Kéo để đổi thứ tự chương"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          type="button"
          {...handleProps}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
        <Button
          aria-label={collapsed ? "Mở chương" : "Thu gọn chương"}
          onClick={() => onToggle(chapter.key)}
          size="sm"
          variant="ghost"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
        </Button>
        <button
          className="min-w-0 flex-1 truncate text-left text-sm font-medium"
          onClick={() => onSelect({ kind: "chapter", chapterKey: chapter.key })}
          type="button"
        >
          {index + 1}. {chapter.title || "Chương chưa đặt tên"}
        </button>
        <span className="shrink-0 text-xs text-muted-foreground">{chapter.lessons.length} bài</span>
        <button
          aria-label="Xoá chương"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          onClick={() => onRemoveChapter(chapter.key)}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </button>
      </div>

      {!collapsed && (
        <SortableContext
          items={chapter.lessons.map((lesson) => lesson.key)}
          strategy={verticalListSortingStrategy}
        >
          <ChapterDropZone chapterKey={chapter.key} empty={chapter.lessons.length === 0}>
            {chapter.lessons.map((lesson, lessonIndex) => (
              <SortableLesson
                chapterKey={chapter.key}
                disabled={disabled}
                key={lesson.key}
                lesson={lesson}
                onRemove={onRemoveLesson}
                onSelect={onSelect}
                position={lessonIndex + 1}
                selection={selection}
              />
            ))}
            <li className="px-6 pt-1">
              <Button disabled={disabled} onClick={() => onAddLesson(chapter.key, "article")} size="sm" variant="ghost">
                <Plus aria-hidden="true" className="size-3.5" />
                Thêm bài
              </Button>
            </li>
          </ChapterDropZone>
        </SortableContext>
      )}
    </li>
  );
}

/**
 * The lesson list of one chapter, highlighted while a lesson could land in it.
 *
 * No droppable of its own: the chapter's own sortable node already covers this area and
 * already answers to `chapter.key`, which is what `onDragEnd` falls back to reading off
 * `over.id` when a lesson is dropped on an empty chapter. Registering a second node under
 * the same id would put two entries in the collision map for one rectangle.
 *
 * Reading the context directly is what keeps the highlight honest: `over.id` alone lights
 * up while a *chapter* is being reordered over this one, which has nothing to do with
 * dropping a lesson inside. A lesson is the drag whose data carries a `chapterKey`.
 */
function ChapterDropZone({
  chapterKey,
  empty,
  children,
}: {
  chapterKey: string;
  empty: boolean;
  children: ReactNode;
}) {
  const { active, over } = useDndContext();
  const lessonIncoming = active?.data.current?.chapterKey !== undefined;
  const isOver = lessonIncoming && over?.id === chapterKey;

  return (
    <ul className={`min-h-10 border-x-0 border-b-0 border-t px-2 py-1.5 ${dropZoneClasses(isOver)}`}>
      {empty && (
        <li className="px-6 py-2 text-xs text-muted-foreground">
          Chương rỗng — kéo bài vào đây, hoặc chuột phải để thêm.
        </li>
      )}
      {children}
    </ul>
  );
}

function SortableLesson({
  lesson,
  chapterKey,
  selection,
  disabled,
  onSelect,
  onRemove,
  position,
}: {
  lesson: DraftLesson;
  chapterKey: string;
  selection: Selection;
  disabled?: boolean;
  onSelect: (selection: Selection) => void;
  onRemove: (chapterKey: string, lessonKey: string) => void;
  /** Số thứ tự TRONG CHƯƠNG, đúng như học viên thấy ở mục lục. */
  position: number;
}) {
  // Chương của bài đi kèm theo `data` để lúc thả biết nguồn và đích.
  const { setNodeRef, style, handleProps, className, dropEdge } = useSortableRow({
    id: lesson.key,
    data: { chapterKey },
    disabled,
  });
  const active =
    selection?.kind === "lesson" &&
    selection.lessonKey === lesson.key &&
    selection.chapterKey === chapterKey;
  const Icon = bearsExercise(lesson.type) ? Braces : lesson.type === "video" ? PlayCircle : FileText;

  return (
    <li
      className={`relative flex items-center gap-1.5 rounded-md px-1 py-1 ${
        active ? "bg-muted" : ""
      } ${className}`}
      ref={setNodeRef}
      style={style}
    >
      <DropIndicator edge={dropEdge} />
      <button
        aria-label="Kéo để đổi thứ tự bài"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        type="button"
        {...handleProps}
      >
        <GripVertical aria-hidden="true" className="size-3.5" />
      </button>
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <button
        className="min-w-0 flex-1 truncate text-left text-sm"
        onClick={() => onSelect({ kind: "lesson", chapterKey, lessonKey: lesson.key })}
        type="button"
      >
        <span className="text-muted-foreground">Bài {position}.</span>{" "}
        {lesson.title || "Bài chưa đặt tên"}
        <span className="ml-2 text-xs text-muted-foreground">
          {LESSON_TYPE_LABELS[lesson.type]}
        </span>
      </button>
      {/* Ngoại lệ hiện ngay trên CÂY, không chỉ trong panel bên phải: đa số bài giờ đây
        * đều bị gác tuần tự ngầm định, nên đáng chú ý là bài nào KHÔNG bị gác — không
        * phải liệt kê từng điều kiện như trước. */}
      {lesson.isPreview && (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground"
          title="Cho học trước — mở cho mọi người kể cả chưa ghi danh, không cần hoàn thành bài/chương liền trước"
        >
          <Unlock aria-hidden="true" className="size-3" />
          học trước
        </span>
      )}
      <button
        aria-label="Xoá bài"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        onClick={() => onRemove(chapterKey, lesson.key)}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  );
}
