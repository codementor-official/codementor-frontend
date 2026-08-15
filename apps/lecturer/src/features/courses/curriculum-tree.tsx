"use client";

import { useState } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Braces, ChevronDown, ChevronRight, FileText, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@codementor/ui";
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
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
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
                  onRemoveChapter={removeChapter}
                  onRemoveLesson={removeLesson}
                  onSelect={onSelect}
                  onToggle={toggle}
                  selection={selection}
                />
              ))}
            </ul>
          </SortableContext>
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
                <MenuItem onClick={() => removeChapter(menu.chapterKey!)}>Xoá chương này</MenuItem>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="flex h-8 w-full items-center rounded-md px-2 text-left text-sm hover:bg-muted"
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.key,
    disabled,
  });
  const active = selection?.kind === "chapter" && selection.chapterKey === chapter.key;

  return (
    <li
      className={`rounded-lg border bg-card ${isDragging ? "opacity-50" : ""}`}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) onContextMenu(event.clientX, event.clientY);
      }}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className={`flex items-center gap-1.5 px-2 py-2 ${active ? "bg-muted" : ""}`}>
        <button
          aria-label="Kéo để đổi thứ tự chương"
          className="cursor-grab text-muted-foreground hover:text-foreground"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
        <button
          aria-label={collapsed ? "Mở chương" : "Thu gọn chương"}
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onToggle(chapter.key)}
          type="button"
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
        </button>
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
          <ul className="min-h-10 border-t px-2 py-1.5">
            {chapter.lessons.length === 0 && (
              <li className="px-6 py-2 text-xs text-muted-foreground">
                Chương rỗng — kéo bài vào đây, hoặc chuột phải để thêm.
              </li>
            )}
            {chapter.lessons.map((lesson) => (
              <SortableLesson
                chapterKey={chapter.key}
                disabled={disabled}
                key={lesson.key}
                lesson={lesson}
                onRemove={onRemoveLesson}
                onSelect={onSelect}
                selection={selection}
              />
            ))}
            <li className="px-6 pt-1">
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={disabled}
                onClick={() => onAddLesson(chapter.key, "article")}
                type="button"
              >
                + Thêm bài
              </button>
            </li>
          </ul>
        </SortableContext>
      )}
    </li>
  );
}

function SortableLesson({
  lesson,
  chapterKey,
  selection,
  disabled,
  onSelect,
  onRemove,
}: {
  lesson: DraftLesson;
  chapterKey: string;
  selection: Selection;
  disabled?: boolean;
  onSelect: (selection: Selection) => void;
  onRemove: (chapterKey: string, lessonKey: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.key,
    // Chương của bài đi kèm theo `data` để lúc thả biết nguồn và đích.
    data: { chapterKey },
    disabled,
  });
  const active =
    selection?.kind === "lesson" &&
    selection.lessonKey === lesson.key &&
    selection.chapterKey === chapterKey;
  const Icon = bearsExercise(lesson.type) ? Braces : FileText;

  return (
    <li
      className={`flex items-center gap-1.5 rounded-md px-1 py-1 ${active ? "bg-muted" : ""} ${
        isDragging ? "opacity-50" : ""
      }`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        aria-label="Kéo để đổi thứ tự bài"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-3.5" />
      </button>
      <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      <button
        className="min-w-0 flex-1 truncate text-left text-sm"
        onClick={() => onSelect({ kind: "lesson", chapterKey, lessonKey: lesson.key })}
        type="button"
      >
        {lesson.title || "Bài chưa đặt tên"}
        <span className="ml-2 text-xs text-muted-foreground">
          {LESSON_TYPE_LABELS[lesson.type]}
        </span>
      </button>
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
