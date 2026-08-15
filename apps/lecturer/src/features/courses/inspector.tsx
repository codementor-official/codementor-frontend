"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "@codementor/editor";
import { Button } from "@codementor/ui";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import {
  LESSON_TYPES,
  LESSON_TYPE_LABELS,
  bearsExercise,
  type DraftChapter,
  type DraftLesson,
  type LessonContent,
} from "@/features/courses/types";
import type { Selection } from "@/features/courses/curriculum-tree";
import type { ExerciseListItem } from "@/features/exercises/types";

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

/**
 * Sidebar cố định bên phải: sửa đúng mục đang chọn trên cây.
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
      <p className="text-sm text-muted-foreground">
        Chọn một chương hoặc một bài ở cây bên trái để sửa thông tin.
      </p>
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
        <h2 className="mb-4 text-sm font-semibold">Chương {chapterIndex + 1}</h2>

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

        <label className="flex items-center gap-2 text-sm">
          <input
            checked={chapter.isOptional}
            className="size-4 accent-primary"
            onChange={(event) => patchChapter({ isOptional: event.target.checked })}
            type="checkbox"
          />
          Chương tùy chọn
        </label>
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
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
    try {
      await saveContent(lesson.id, { contentHtml: html, summary: summary || undefined });
      setNotice("Đã lưu nội dung");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Lưu nội dung thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <fieldset disabled={disabled}>
      <h2 className="mb-4 text-sm font-semibold">{LESSON_TYPE_LABELS[lesson.type]}</h2>

      <Field htmlFor="lesson-title" label="Tiêu đề bài">
        <input
          className={inputClassName}
          id="lesson-title"
          onChange={(event) => onPatch({ title: event.target.value })}
          value={lesson.title}
        />
      </Field>

      <Field htmlFor="lesson-type" label="Kiểu bài">
        <select
          className={inputClassName}
          id="lesson-type"
          onChange={(event) => {
            const type = event.target.value as DraftLesson["type"];
            // Đổi sang kiểu không mang bài code thì phải bỏ liên kết, nếu không CSDL
            // từ chối bằng CHECK `lessons_exercise_only_for_exercise_types`.
            onPatch({ type, ...(bearsExercise(type) ? {} : { exerciseId: null, exerciseTitle: null }) });
          }}
          value={lesson.type}
        >
          {LESSON_TYPES.map((type) => (
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

      <div className="mb-5 grid gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={lesson.isPreview}
            className="size-4 accent-primary"
            onChange={(event) => onPatch({ isPreview: event.target.checked })}
            type="checkbox"
          />
          Cho học thử miễn phí
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={lesson.isOptional}
            className="size-4 accent-primary"
            onChange={(event) => onPatch({ isOptional: event.target.checked })}
            type="checkbox"
          />
          Bài tùy chọn
        </label>
      </div>

      {bearsExercise(lesson.type) ? (
        <Field
          hint="Chỉ hiện bài đã công khai và bài của bạn."
          htmlFor="lesson-exercise"
          label="Bài code"
        >
          <select
            className={inputClassName}
            id="lesson-exercise"
            onChange={(event) => {
              const exerciseId = event.target.value || null;
              onPatch({
                exerciseId,
                exerciseTitle:
                  exercises.find((exercise) => exercise.id === exerciseId)?.title ?? null,
              });
            }}
            value={lesson.exerciseId ?? ""}
          >
            <option value="">— chưa gắn bài nào —</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.title}
              </option>
            ))}
          </select>
        </Field>
      ) : !lesson.id ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
          Lưu cây nội dung một lần để bài có mã, rồi mới soạn được nội dung ở đây.
        </p>
      ) : (
        <>
          <Field htmlFor="lesson-summary" label="Tóm tắt">
            <input
              className={inputClassName}
              id="lesson-summary"
              onChange={(event) => setSummary(event.target.value)}
              value={summary}
            />
          </Field>

          <p className="mb-1.5 block text-sm font-medium">Nội dung</p>
          {loaded ? (
            <RichTextEditor onChange={setHtml} value={html} />
          ) : (
            <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <Button disabled={saving} onClick={() => void persist()} size="sm" type="button">
              {saving ? "Đang lưu…" : "Lưu nội dung"}
            </Button>
            {notice && (
              <span className="text-sm text-muted-foreground" role="status">
                {notice}
              </span>
            )}
          </div>
        </>
      )}
    </fieldset>
  );
}
