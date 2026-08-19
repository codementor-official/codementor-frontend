"use client";

import { useEffect, useState } from "react";
import { Braces, Check, FileText, Info, MousePointerClick, Save, Search } from "lucide-react";
import { RichTextEditor } from "@codementor/editor";
import { Button, Select, StatusBadge, useToast } from "@codementor/ui";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { InfoHint } from "@/components/form/info-hint";
import {
  LESSON_TYPE_LABELS,
  SELECTABLE_LESSON_TYPES,
  bearsExercise,
  type DraftChapter,
  type DraftLesson,
  type LessonContent,
} from "@/features/courses/types";
import type { Selection } from "@/features/courses/curriculum-tree";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type ExerciseListItem,
} from "@codementor/solve";

interface Props {
  chapters: DraftChapter[];
  selection: Selection;
  onChange: (chapters: DraftChapter[]) => void;
  disabled?: boolean;
  /** Bài code để gắn vào ô. Chỉ nạp khi thật sự cần — studio không phải màn duyệt bài. */
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  saveContent: (lessonId: string, content: LessonContent) => Promise<void>;
}

/** Tiêu đề một khối trong panel — cùng hình dạng với separator ở drawer danh sách. */
function PanelSection({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: typeof FileText;
  /** Mô tả khối, nằm trong tooltip cạnh tiêu đề. */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 first:mt-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <h3 className="text-xs font-bold tracking-wide uppercase">{title}</h3>
        {hint && <InfoHint text={hint} />}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

/** Checkbox hàng ngang, có viền — bấm được cả dòng thay vì đúng ô 16px. */
function ToggleRow({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2 hover:bg-muted/40">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm">
        <input
          checked={checked}
          className="size-4 shrink-0 accent-primary"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="min-w-0 truncate">{label}</span>
      </label>
      {hint && <InfoHint text={hint} />}
    </div>
  );
}

/**
 * Panel bên phải: sửa đúng mục đang chọn trên cây.
 *
 * Nội dung bài lý thuyết được lưu RIÊNG, không đi cùng lệnh ghi curriculum: nó nằm ở
 * MongoDB và chỉ ghi được khi bài đã có `id` thật, tức là sau lần lưu cây đầu tiên.
 */
export function Inspector({
  chapters,
  selection,
  onChange,
  disabled,
  exercises,
  loadContent,
  saveContent,
}: Props) {
  if (!selection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MousePointerClick aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium">Chưa chọn mục nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn một chương hoặc một bài ở cây bên trái để sửa thông tin của nó.
          </p>
        </div>
      </div>
    );
  }

  const chapterIndex = chapters.findIndex((chapter) => chapter.key === selection.chapterKey);
  if (chapterIndex < 0) return null;
  const chapter = chapters[chapterIndex];

  const patchChapter = (partial: Partial<DraftChapter>) => {
    const next = [...chapters];
    next[chapterIndex] = { ...chapter, ...partial };
    onChange(next);
  };

  if (selection.kind === "chapter") {
    return (
      <fieldset disabled={disabled}>
        <PanelSection
          hint="Chương là khối gom bài. Học viên thấy tên chương ở mục lục khóa học."
          icon={Info}
          title={`Chương ${chapterIndex + 1}`}
        >
          <div className="grid gap-4">
            <Field htmlFor="chapter-title" label="Tiêu đề chương">
              <input
                className={inputClassName}
                id="chapter-title"
                onChange={(event) => patchChapter({ title: event.target.value })}
                value={chapter.title}
              />
            </Field>

            <Field htmlFor="chapter-description" label="Mô tả">
              <textarea
                className={textareaClassName}
                id="chapter-description"
                onChange={(event) => patchChapter({ description: event.target.value })}
                value={chapter.description}
              />
            </Field>

            <ToggleRow
              checked={chapter.isOptional}
              hint="Học viên bỏ qua được mà vẫn hoàn thành khóa học."
              label="Chương tùy chọn"
              onChange={(checked) => patchChapter({ isOptional: checked })}
            />
          </div>
        </PanelSection>
      </fieldset>
    );
  }

  const lessonIndex = chapter.lessons.findIndex((lesson) => lesson.key === selection.lessonKey);
  if (lessonIndex < 0) return null;
  const lesson = chapter.lessons[lessonIndex];

  const patchLesson = (partial: Partial<DraftLesson>) => {
    const lessons = [...chapter.lessons];
    lessons[lessonIndex] = { ...lesson, ...partial };
    patchChapter({ lessons });
  };

  return (
    <LessonInspector
      disabled={disabled}
      exercises={exercises}
      key={lesson.key}
      lesson={lesson}
      loadContent={loadContent}
      onPatch={patchLesson}
      saveContent={saveContent}
    />
  );
}

function LessonInspector({
  lesson,
  onPatch,
  disabled,
  exercises,
  loadContent,
  saveContent,
}: {
  lesson: DraftLesson;
  onPatch: (partial: Partial<DraftLesson>) => void;
  disabled?: boolean;
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  saveContent: (lessonId: string, content: LessonContent) => Promise<void>;
}) {
  // Ô bài code không có thân bài riêng, và bài chưa lưu lần nào thì chưa có id để đọc.
  const needsContent = Boolean(lesson.id) && !bearsExercise(lesson.type);

  const [html, setHtml] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  // Component được key theo `lesson.key` nên nó remount mỗi lần đổi bài; giá trị khởi
  // tạo này vì thế luôn đúng với bài đang chọn.
  const [loaded, setLoaded] = useState(!needsContent);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!needsContent || !lesson.id) return;
    let cancelled = false;
    loadContent(lesson.id)
      .then((content) => {
        if (cancelled) return;
        setHtml(content?.contentHtml ?? "");
        setSummary(content?.summary ?? "");
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson.id, needsContent, loadContent]);

  const persist = async () => {
    if (!lesson.id) return;
    setSaving(true);
    try {
      await saveContent(lesson.id, { contentHtml: html, summary: summary || undefined });
      toast.success("Đã lưu nội dung bài");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Lưu nội dung thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Kiểu cũ (video, trắc nghiệm…) không mời chọn mới nữa, nhưng một bài đang mang kiểu đó
  // phải giữ được nó — bỏ khỏi danh sách là lặng lẽ đổi kiểu bài của người ta.
  const typeOptions = SELECTABLE_LESSON_TYPES.includes(lesson.type)
    ? SELECTABLE_LESSON_TYPES
    : [...SELECTABLE_LESSON_TYPES, lesson.type];

  return (
    <fieldset disabled={disabled}>
      <PanelSection
        hint="Phần hiện ở mục lục khóa học: tên bài, kiểu bài và thời lượng ước tính."
        icon={Info}
        title="Thông tin bài"
      >
        <div className="grid gap-4">
          <Field htmlFor="lesson-title" label="Tiêu đề bài">
            <input
              className={inputClassName}
              id="lesson-title"
              onChange={(event) => onPatch({ title: event.target.value })}
              value={lesson.title}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="lesson-type" label="Kiểu bài">
              <select
                className={inputClassName}
                id="lesson-type"
                onChange={(event) => {
                  const type = event.target.value as DraftLesson["type"];
                  // Đổi sang kiểu không mang bài code thì phải bỏ liên kết, nếu không CSDL
                  // từ chối bằng CHECK `lessons_exercise_only_for_exercise_types`.
                  onPatch({
                    type,
                    ...(bearsExercise(type) ? {} : { exerciseId: null, exerciseTitle: null }),
                  });
                }}
                value={lesson.type}
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {LESSON_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>

            <Field htmlFor="lesson-duration" label="Thời lượng (phút)">
              <input
                className={inputClassName}
                id="lesson-duration"
                inputMode="numeric"
                onChange={(event) => onPatch({ durationMinutes: event.target.value })}
                value={lesson.durationMinutes}
              />
            </Field>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleRow
              checked={lesson.isPreview}
              hint="Bài mở cho cả người chưa ghi danh khóa học — dùng làm bài nếm thử."
              label="Cho học thử miễn phí"
              onChange={(checked) => onPatch({ isPreview: checked })}
            />
            <ToggleRow
              checked={lesson.isOptional}
              hint="Học viên bỏ qua được mà khóa học vẫn tính là hoàn thành."
              label="Bài tùy chọn"
              onChange={(checked) => onPatch({ isOptional: checked })}
            />
          </div>
        </div>
      </PanelSection>

      {bearsExercise(lesson.type) ? (
        <PanelSection
          hint="Gắn một bài code có sẵn vào ô này. Học viên mở bài sẽ vào thẳng màn làm bài đó."
          icon={Braces}
          title="Bài code"
        >
          <ExercisePicker
            disabled={disabled}
            exercises={exercises}
            onPick={(exercise) =>
              onPatch({
                exerciseId: exercise?.id ?? null,
                exerciseTitle: exercise?.title ?? null,
              })
            }
            selectedId={lesson.exerciseId}
            selectedTitle={lesson.exerciseTitle}
          />
        </PanelSection>
      ) : !lesson.id ? (
        <PanelSection icon={FileText} title="Nội dung bài">
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            Lưu cây nội dung một lần để bài có mã, rồi mới soạn được nội dung ở đây.
          </p>
        </PanelSection>
      ) : (
        <PanelSection icon={FileText} title="Nội dung bài">
          <div className="grid gap-4">
            <Field htmlFor="lesson-summary" hint="Một dòng hiện ở đầu bài học." label="Tóm tắt">
              <input
                className={inputClassName}
                id="lesson-summary"
                onChange={(event) => setSummary(event.target.value)}
                value={summary}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-medium">Thân bài</p>
              {loaded ? (
                <RichTextEditor onChange={setHtml} value={html} />
              ) : (
                <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>
              )}
            </div>

            {/* Nút riêng vì thân bài lưu riêng: nút "Lưu" trên đầu studio ghi cây nội dung
                xuống PostgreSQL, còn cái này ghi thân bài xuống MongoDB. */}
            <div className="flex items-center gap-3">
              <Button disabled={saving} onClick={() => void persist()} size="sm" type="button">
                <Save aria-hidden="true" className="size-3.5" />
                {saving ? "Đang lưu…" : "Lưu nội dung bài"}
              </Button>
            </div>
          </div>
        </PanelSection>
      )}
    </fieldset>
  );
}

/**
 * Chọn bài code để gắn vào ô: tìm kiếm, lọc theo độ khó, phân trang.
 *
 * Thay cho một `<select>` phẳng đổ cả kho bài vào: một danh sách bài không có tiêu đề cột,
 * không tìm được, và không cho thấy bài đang chọn ở trạng thái nào.
 */
function ExercisePicker({
  exercises,
  selectedId,
  selectedTitle,
  onPick,
  disabled,
}: {
  exercises: ExerciseListItem[];
  selectedId: string | null;
  selectedTitle: string | null;
  onPick: (exercise: ExerciseListItem | null) => void;
  disabled?: boolean;
}) {
  const [difficulty, setDifficulty] = useState("");

  const pool = exercises.filter((item) => difficulty === "" || item.difficulty === difficulty);
  const list = usePagedList(pool, (item, query) =>
    `${item.title} ${item.slug}`.toLowerCase().includes(query),
  );

  const selected = exercises.find((item) => item.id === selectedId);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">Bài đang gắn</span>
          <span className="block truncate text-sm font-medium">
            {selected?.title ?? selectedTitle ?? "— chưa gắn bài nào —"}
          </span>
        </span>
        {selectedId && (
          <Button disabled={disabled} onClick={() => onPick(null)} size="sm" type="button" variant="ghost">
            Bỏ gắn
          </Button>
        )}
      </div>

      <ListSearch
        filters={
          <Select
            className="h-9"
            label="Độ khó"
            onChange={setDifficulty}
            options={[
              { value: "", label: "Mọi độ khó" },
              ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] })),
            ]}
            value={difficulty}
          />
        }
        onChange={list.setQuery}
        placeholder="Tìm bài code theo tên hoặc slug…"
        value={list.query}
      />

      {list.visible.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          <Search aria-hidden="true" className="mx-auto mb-2 size-4" />
          Không có bài nào khớp. Chỉ hiện bài đã công khai và bài của bạn.
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {list.visible.map((exercise) => {
            const active = exercise.id === selectedId;
            return (
              <li key={exercise.id}>
                <button
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "hover:bg-muted/40"
                  }`}
                  disabled={disabled}
                  onClick={() => onPick(exercise)}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{exercise.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {DIFFICULTY_LABELS[exercise.difficulty]} · {exercise.slug}
                    </span>
                  </span>
                  <StatusBadge tone={STATUS_TONES[exercise.status]}>
                    {STATUS_LABELS[exercise.status]}
                  </StatusBadge>
                  {active && <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ListPager
        onChange={list.setPage}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        unit="bài code"
      />
    </div>
  );
}
