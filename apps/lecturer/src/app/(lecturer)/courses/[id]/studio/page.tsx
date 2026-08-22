"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Info, Save, Send, Tags, TriangleAlert, Undo2 } from "lucide-react";
import { ApiClientError } from "@codementor/api-client";
import { Group, Panel } from "react-resizable-panels";
import {
  Button,
  Card,
  Modal,
  PageHeader,
  ReasonButton,
  ResizeHandle,
  StatusBadge,
  useToast,
  useUndoableDelete,
} from "@codementor/ui";
import { CardHeading } from "@/components/page/card-heading";
import { DangerZone } from "@/components/page/danger-zone";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import { CurriculumTree, type Selection } from "@/features/courses/curriculum-tree";
import { Inspector, type ContentSaveRef } from "@/features/courses/inspector";
import {
  toDraft,
  toPayload,
  type Course,
  type DraftChapter,
  type LessonContent,
} from "@/features/courses/types";
import type { ExerciseListItem } from "@codementor/solve";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  LEVELS,
  LEVEL_LABELS,
  MODES,
  MODE_LABELS,
} from "@/features/roadmaps/types";
import { api } from "@/lib/api";
import { integer, isClean, slug as slugRule, text, url, type FieldError } from "@codementor/utils";

interface Meta {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  level: string;
  progressionMode: string;
  prerequisiteNote: string;
}

/**
 * Chữ ký của bản nháp, để biết còn gì chưa lưu.
 *
 * Cây đi qua `toPayload` chứ không so trực tiếp: `toDraft` sinh `key` ngẫu nhiên cho mỗi
 * hàng, nên hai bản sao y hệt nhau vẫn khác chuỗi JSON.
 */
function signature(meta: Meta, chapters: DraftChapter[]): string {
  return JSON.stringify([meta, toPayload(chapters)]);
}

/**
 * Giữ nguyên mục đang chọn qua một lần lưu, theo VỊ TRÍ chứ không theo `key`.
 *
 * `toDraft` sinh `key` mới cho mọi hàng CHƯA có `id` (xem `keyFor` ở types.ts) — một bài
 * vừa tạo chưa lưu có key ngẫu nhiên, và sau khi lưu nó có `id` thật nên key đổi theo.
 * Không remap thì `selection` giữ key cũ, panel bên phải không khớp hàng nào trong cây
 * mới và trắng trơn ngay sau khi lưu — đúng lúc người soạn vừa bấm "Lưu" xong. Vị trí ổn
 * định vì lưu không tự sắp xếp lại chương/bài.
 */
function remapSelection(
  prevChapters: DraftChapter[],
  nextChapters: DraftChapter[],
  selection: Selection,
): Selection {
  if (!selection) return null;
  const chapterIndex = prevChapters.findIndex((chapter) => chapter.key === selection.chapterKey);
  const nextChapter = chapterIndex >= 0 ? nextChapters[chapterIndex] : undefined;
  if (!nextChapter) return null;
  if (selection.kind === "chapter") return { kind: "chapter", chapterKey: nextChapter.key };

  const lessonIndex = prevChapters[chapterIndex].lessons.findIndex(
    (lesson) => lesson.key === selection.lessonKey,
  );
  const nextLesson = lessonIndex >= 0 ? nextChapter.lessons[lessonIndex] : undefined;
  return nextLesson ? { kind: "lesson", chapterKey: nextChapter.key, lessonKey: nextLesson.key } : null;
}

interface StoredDraft {
  meta: Meta;
  chapters: DraftChapter[];
  savedAt: number;
}

function draftStorageKey(courseId: string): string {
  return `codementor:lecturer:course-draft:${courseId}`;
}

/**
 * Khôi phục nháp là tiện ích thêm, không phải đường lưu chính — hỏng ở bất kỳ bước nào
 * (hết dung lượng, trình duyệt chặn localStorage, tab ẩn danh) chỉ có nghĩa là không
 * khôi phục được, đường "Lưu" ở đầu trang vẫn hoạt động bình thường.
 */
function readDraft(courseId: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(draftStorageKey(courseId));
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(courseId: string, meta: Meta, chapters: DraftChapter[]): void {
  try {
    const draft: StoredDraft = { meta, chapters, savedAt: Date.now() };
    window.localStorage.setItem(draftStorageKey(courseId), JSON.stringify(draft));
  } catch {
    // ignore — xem readDraft
  }
}

function clearDraft(courseId: string): void {
  try {
    window.localStorage.removeItem(draftStorageKey(courseId));
  } catch {
    // ignore — xem readDraft
  }
}

/**
 * Lỗi của từng ô trong tab "Thông tin khóa học".
 *
 * `description` KHÔNG bắt buộc để lưu nhưng bắt buộc để gửi duyệt — đó là luật của
 * `Course.submit`, và ép nó ngay lúc lưu sẽ chặn cả việc lưu dở một bản nháp. Nên nó
 * được kiểm riêng ở `submitBlockers` bên dưới.
 */
function validateMeta(meta: Meta): Record<string, FieldError> {
  return {
    title: text(meta.title, 200, "Tiêu đề"),
    slug: slugRule(meta.slug),
    description: meta.description.trim().length > 5000 ? "Mô tả tối đa 5000 ký tự" : undefined,
    coverImageUrl: url(meta.coverImageUrl, "Ảnh bìa"),
    prerequisiteNote:
      meta.prerequisiteNote.trim().length > 1000 ? "Ghi chú tối đa 1000 ký tự" : undefined,
  };
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

  const toast = useToast();
  const [tab, setTab] = useState<"curriculum" | "metadata">("curriculum");
  const [course, setCourse] = useState<Course | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [chapters, setChapters] = useState<DraftChapter[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { scheduleDelete } = useUndoableDelete();
  const [savedSignature, setSavedSignature] = useState("");
  // Nhớ mục đang chọn từ TRƯỚC lần lưu để `apply` remap được nó sang key mới — xem
  // `remapSelection`. Effect riêng vì `apply` phải giữ chữ ký ổn định ([] deps) để không
  // tạo lại mỗi lần render.
  const chaptersRef = useRef<DraftChapter[]>([]);
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);
  // Lỗi ở thân bài của mục đang mở trong Inspector (ví dụ URL video sai) — gộp vào
  // `blocker` chung để nút "Lưu" duy nhất khoá đúng lúc. Xem inspector.tsx.
  const [contentBlocker, setContentBlocker] = useState<string | undefined>(undefined);
  // Nút "Lưu" chung gọi hàm mà Inspector đăng ký vào đây, SAU KHI cây đã lưu xong.
  const contentSaveRef = useRef<ContentSaveRef["current"]>(null);
  // Nháp phát hiện trong localStorage lúc mở trang, còn chờ người dùng chọn khôi phục
  // hay bỏ qua — xem effect nạp khóa học bên dưới và ô thoại render ở cuối component.
  const [pendingDraft, setPendingDraft] = useState<StoredDraft | null>(null);

  const apply = useCallback((loaded: Course) => {
    const nextMeta = toMeta(loaded);
    const nextChapters = toDraft(loaded.chapters ?? []);
    setCourse(loaded);
    setMeta(nextMeta);
    setChapters(nextChapters);
    setSavedSignature(signature(nextMeta, nextChapters));
    setSelection((current) => remapSelection(chaptersRef.current, nextChapters, current));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.courses
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        apply(loaded);
        // Nháp cũ trùng với bản vừa tải thì không hỏi gì cả — dọn luôn cho gọn.
        const draft = readDraft(id);
        if (!draft) return;
        if (signature(draft.meta, draft.chapters) === signature(toMeta(loaded), toDraft(loaded.chapters ?? []))) {
          clearDraft(id);
        } else {
          setPendingDraft(draft);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(describe(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [id, apply]);

  // Ghi nháp mỗi khi có thay đổi chưa lưu, xoá khi khớp lại bản đã lưu (vừa tải xong,
  // hoặc vừa lưu thành công). Đủ nhanh cho một bản nháp cỡ vài chục bài — không cần
  // debounce cho `localStorage.setItem` ở quy mô này.
  useEffect(() => {
    if (!meta) return;
    if (signature(meta, chapters) === savedSignature) {
      clearDraft(id);
      return;
    }
    writeDraft(id, meta, chapters);
  }, [id, meta, chapters, savedSignature]);

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

  // Trước early return: hook phải chạy ở mọi lần render.
  const unsavedDialog = useUnsavedGuard(
    Boolean(meta) && signature(meta as Meta, chapters) !== savedSignature,
  );

  if (error && !course) {
    return (
      <div className="px-4 py-4 sm:px-5">
        <PageHeader title="Studio khóa học" />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!course || !meta) {
    return <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">Đang tải…</p>;
  }

  const locked = course.status === "pending_review";
  const patchMeta = (partial: Partial<Meta>) => setMeta({ ...meta, ...partial });

  const metaErrors = validateMeta(meta);
  const metaValid = isClean(metaErrors);
  // Bài học cũng phải hợp lệ: cây được ghi trong cùng một lệnh với metadata, nên một bài
  // thiếu tiêu đề sẽ làm hỏng cả lượt lưu — và thông báo trả về từ backend chỉ nói "bài 2
  // của chương 1", tức là người soạn phải tự đi tìm.
  const lessonProblem = chapters.flatMap((chapter, chapterIndex) =>
    chapter.lessons.flatMap((lesson, lessonIndex) => {
      const where = `Chương ${chapterIndex + 1} · Bài ${lessonIndex + 1}`;
      const problem =
        text(lesson.title, 200, `Tiêu đề bài ở ${where}`) ??
        integer(lesson.durationMinutes, `Thời lượng ở ${where}`, { min: 1, max: 100000 });
      return problem ? [problem] : [];
    }),
  )[0];
  const chapterProblem = chapters.flatMap((chapter, chapterIndex) => {
    const problem = text(chapter.title, 200, `Tiêu đề chương ${chapterIndex + 1}`);
    return problem ? [problem] : [];
  })[0];

  const blocker = metaValid
    ? (chapterProblem ?? lessonProblem ?? contentBlocker)
    : "Còn ô chưa hợp lệ ở tab “Thông tin khóa học”";

  // Metadata trước, cây sau: cây trả về đã kèm số chương/bài do trigger cập nhật, nên
  // nó phải là câu trả lời cuối cùng. Dùng chung cho nút "Lưu" và `ensureLessonId`.
  const saveAll = async (): Promise<Course> => {
    await api.courses.update(id, {
      ...(meta.slug !== course.slug ? { slug: meta.slug } : {}),
      title: meta.title,
      description: meta.description || null,
      coverImageUrl: meta.coverImageUrl || null,
      level: meta.level,
      progressionMode: meta.progressionMode,
      prerequisiteNote: meta.prerequisiteNote || null,
    });
    const firstPass = await api.courses.saveCurriculum(id, toPayload(chapters));

    // Một bài mới tạo trong CHÍNH lượt lưu này chưa có `id` lúc `toPayload` ở trên chạy,
    // nên nó bỏ qua điều kiện mở khoá của bài đó — backend đòi id thật ở cả hai đầu cạnh
    // (xem `toPayload`). Bài đó giờ đã có id thật từ `firstPass`; ghép điều kiện người
    // soạn đã chọn (còn nguyên trong `chapters`, đúng VỊ TRÍ vì lượt lưu trên không sắp
    // xếp lại gì) vào cây vừa có id rồi lưu thêm một lượt, để không âm thầm mất nó.
    const withFreshIds = toDraft(firstPass.chapters ?? []);
    const hasNewPrereqs = chapters.some((chapter, chapterIndex) =>
      chapter.lessons.some(
        (lesson, lessonIndex) =>
          lesson.id === undefined &&
          lesson.prerequisites.lessonIds.length > 0 &&
          withFreshIds[chapterIndex]?.lessons[lessonIndex]?.id !== undefined,
      ),
    );
    if (!hasNewPrereqs) return firstPass;

    const merged = withFreshIds.map((chapter, chapterIndex) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson, lessonIndex) => ({
        ...lesson,
        prerequisites: chapters[chapterIndex]?.lessons[lessonIndex]?.prerequisites ?? lesson.prerequisites,
      })),
    }));
    return api.courses.saveCurriculum(id, toPayload(merged));
  };

  /**
   * Bài lý thuyết mới tạo chưa có `id` — thân bài lưu ở MongoDB, cần `id` thật trước khi
   * ghi được. Dùng khi soạn thân bài/tải video CHƯA bấm nút "Lưu" chung: người soạn viết
   * ngay, hàm này tự lưu cây trước nếu cần thay vì bắt tự bấm "Lưu" ở đầu trang trước.
   */
  const ensureLessonId = async (chapterIndex: number, lessonIndex: number): Promise<string> => {
    const existing = chapters[chapterIndex]?.lessons[lessonIndex]?.id;
    if (existing) return existing;
    const saved = await saveAll();
    apply(saved);
    const newId = saved.chapters?.[chapterIndex]?.lessons[lessonIndex]?.id;
    if (!newId) throw new Error("Không lưu được bài học — thử bấm Lưu ở đầu trang.");
    return newId;
  };

  /**
   * Nút "Lưu" chung ở đầu trang: lưu cây/metadata, rồi lưu luôn thân bài của mục đang mở
   * trong Inspector (nếu có) — studio chỉ còn MỘT nút lưu cho cả trang. Chạy SAU khi cây
   * đã lưu xong nên `lessonId` lấy từ `saved`, không phải từ `chapters` cũ (bài mới tạo
   * chưa có id ở đó).
   */
  const saveEverything = async (): Promise<Course> => {
    const saved = await saveAll();
    if (contentSaveRef.current && selection?.kind === "lesson") {
      const chapterIndex = chapters.findIndex((chapter) => chapter.key === selection.chapterKey);
      const lessonIndex =
        chapterIndex >= 0
          ? chapters[chapterIndex].lessons.findIndex((lesson) => lesson.key === selection.lessonKey)
          : -1;
      const freshLessonId =
        chapterIndex >= 0 && lessonIndex >= 0
          ? saved.chapters?.[chapterIndex]?.lessons[lessonIndex]?.id
          : undefined;
      if (freshLessonId) await contentSaveRef.current(freshLessonId);
    }
    return saved;
  };

  return (
    <>
    {unsavedDialog}
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
              clearDraft(id);
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
              setMeta(pendingDraft.meta);
              setChapters(pendingDraft.chapters);
              setSelection(null);
              setPendingDraft(null);
            }}
            type="button"
          >
            Khôi phục thay đổi
          </Button>
        </div>
      }
      onClose={() => {
        clearDraft(id);
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
                  disabled={saving || blocker !== undefined}
                  onClick={() => run(saveEverything, "Đã lưu")}
                  title={blocker}
                  type="button"
                  variant="outline"
                >
                  <Save aria-hidden="true" className="size-4" />
                  {saving ? "Đang lưu…" : "Lưu"}
                </Button>
                {/* Gửi LẠI thì hỏi đã sửa gì — người duyệt đã đọc bản trước, câu đó là
                    thứ duy nhất cho họ biết cần xem lại chỗ nào. Lần gửi đầu từ bản nháp
                    thì không hỏi: chưa có quyết định nào để giải thích. */}
                {course.requiresSubmitNote ? (
                  <ReasonButton
                    confirmLabel="Gửi duyệt lại"
                    description="Người duyệt đã xem bản trước. Nói ngắn gọn bạn vừa sửa gì."
                    disabled={saving || blocker !== undefined}
                    onConfirm={(note) => run(() => api.courses.submit(id, note), "Đã gửi duyệt")}
                    placeholder="Đã bổ sung mô tả và sửa lại nội dung chương 2 theo góp ý."
                    title="Gửi duyệt lại"
                    variant="default"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    Gửi duyệt lại
                  </ReasonButton>
                ) : (
                  <Button
                    disabled={saving || blocker !== undefined}
                    onClick={() => run(() => api.courses.submit(id), "Đã gửi duyệt")}
                    title={blocker}
                    type="button"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    Gửi duyệt
                  </Button>
                )}
              </>
            )}
            {/* Nút bị khoá mà không nói vì sao là chỗ người dùng bấm mãi rồi bỏ cuộc. */}
            {blocker && !locked && (
              <p className="w-full text-sm text-destructive" role="alert">
                {blocker}
              </p>
            )}
          </div>
      }
      backHref="/courses"
      backLabel="Khóa học"
      meta={`${course.totalChapters} chương · ${course.totalLessons} bài · ${
        course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"
      }`}
      rejectionReason={course.rejectionReason}
      slug={course.slug}
      status={
        <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
          {CONTENT_STATUS_LABELS[course.status]}
        </StatusBadge>
      }
      tabs={{
        options: [
          { value: "curriculum", label: "Nội dung" },
          { value: "metadata", label: "Thông tin khóa học" },
        ],
        value: tab,
        onChange: (value) => setTab(value as "curriculum" | "metadata"),
      }}
      title={meta.title || "Khóa học chưa đặt tên"}
    >
      {tab === "curriculum" ? (
        // Two panes rather than a fixed 380px column: how much room the inspector needs
        // depends on whether the selected lesson is a one-field chapter or a rich-text
        // body, and only the person editing knows which.
        <Group orientation="horizontal" className="h-full">
          <Panel id="tree" defaultSize="55%" minSize="25%" className="min-h-0">
            <div className="h-full overflow-y-auto p-3">
              <CurriculumTree
                chapters={chapters}
                disabled={locked}
                onChange={setChapters}
                onSelect={setSelection}
                selection={selection}
              />
            </div>
          </Panel>

          <ResizeHandle orientation="horizontal" />

          <Panel id="inspector" defaultSize="45%" minSize="20%" className="min-h-0">
            <div className="h-full overflow-y-auto p-3">
              <Inspector
                chapters={chapters}
                contentSaveRef={contentSaveRef}
                courseId={id}
                disabled={locked}
                ensureLessonId={ensureLessonId}
                exercises={exercises}
                loadContent={loadContent}
                onChange={setChapters}
                onContentBlockerChange={setContentBlocker}
                progressionMode={meta.progressionMode}
                saveContent={saveContent}
                selection={selection}
              />
            </div>
          </Panel>
        </Group>
      ) : (
        <StudioScroll>
        <fieldset className="grid gap-4 lg:grid-cols-3" disabled={locked}>
          <Card className="p-5 lg:col-span-2">
            <CardHeading
              hint="Những gì học viên đọc thấy ở trang khóa học và ở danh mục. Mô tả là trường bắt buộc để gửi duyệt."
              icon={Info}
              title="Thông tin khóa học"
            />

            <Field error={metaErrors.title}
              htmlFor="title" label="Tiêu đề">
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
              error={metaErrors.slug}
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

            <Field error={metaErrors.description}
              htmlFor="description" hint="Bắt buộc có để gửi duyệt." label="Mô tả">
              <textarea
                className={textareaClassName}
                id="description"
                onChange={(event) => patchMeta({ description: event.target.value })}
                value={meta.description}
              />
            </Field>

            <Field error={metaErrors.coverImageUrl}
              htmlFor="coverImageUrl" hint="http:// hoặc https://" label="Ảnh bìa (URL)">
              <input
                className={inputClassName}
                id="coverImageUrl"
                onChange={(event) => patchMeta({ coverImageUrl: event.target.value })}
                placeholder="https://"
                value={meta.coverImageUrl}
              />
            </Field>

            <Field error={metaErrors.prerequisiteNote}
              htmlFor="prerequisiteNote" label="Ghi chú điều kiện tiên quyết">
              <textarea
                className={textareaClassName}
                id="prerequisiteNote"
                onChange={(event) => patchMeta({ prerequisiteNote: event.target.value })}
                value={meta.prerequisiteNote}
              />
            </Field>
          </Card>

          <Card className="h-fit p-5">
            <CardHeading
              hint="Quyết định khóa học xuất hiện ở bộ lọc nào và học viên có phải học lần lượt từng bài hay không."
              icon={Tags}
              title="Phân loại"
            />

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

          <div className="lg:col-span-3">
            <DangerZone
              actionLabel="Xoá khóa học này"
              confirmDescription={`Khóa học “${meta.title || course.slug}” sẽ bị xoá cùng toàn bộ chương và bài bên trong. Có vài giây để hoàn tác sau khi xác nhận.`}
              confirmTitle="Xoá khóa học này?"
              description={
                course.status === "published"
                  ? "Khóa học đã công khai thì không xoá được — học viên đang học và tiến độ của họ nằm ở đây. Gỡ công khai trước."
                  : "Xoá khóa học này cùng toàn bộ chương và bài bên trong. Có vài giây để hoàn tác sau khi xác nhận."
              }
              disabled={saving || course.status === "published"}
              onConfirm={() => {
                // Lệnh xoá thật hoãn lại vài giây (xem `useUndoableDelete`); điều hướng
                // về danh sách ngay để không đứng lại một trang sắp không còn gì để sửa.
                // Dòng này vẫn hiện ở danh sách cho tới khi hộp "Hoàn tác" hết giờ.
                scheduleDelete({
                  id,
                  message: `Đã xoá khoá học "${meta.title || course.slug}".`,
                  commit: () => api.courses.remove(id),
                });
                router.push("/courses");
              }}
              title="Xoá khóa học"
            />
          </div>
          </fieldset>
        </StudioScroll>
      )}
    </StudioShell>
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
