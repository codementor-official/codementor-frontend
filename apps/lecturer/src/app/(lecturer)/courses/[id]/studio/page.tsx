"use client";
import { PriceEditor } from "@/features/commerce/price-editor";
import { CoursePurchases } from "@/features/commerce/course-purchases";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InfoIcon as Info, FloppyDiskIcon as Save, PaperPlaneRightIcon as Send, TagIcon as Tags, WarningIcon as TriangleAlert, ArrowUUpLeftIcon as Undo2 } from "@phosphor-icons/react/ssr";
import { ApiClientError } from "@codementor/api-client";
import {
  BreadcrumbTitle,
  Button,
  Card,
  CompletionsPanel,
  type CompletionsQuery,
  Modal,
  PageHeader,
  ReasonButton,
  StatusBadge,
  useToast,
  useUndoableDelete,
  TopicPicker,
  StudioSplit,
} from "@codementor/ui";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");
import { CardHeading } from "@/components/page/card-heading";
import { DangerZone } from "@/components/page/danger-zone";
import { StudioScroll, StudioShell } from "@/components/page/studio-shell";
import { Field, fieldA11y, inputClassName, textareaClassName } from "@/components/form/field";
import { CertificateTemplateSelect } from "@/features/certificates/certificate-template-select";
import { CoverImageField } from "@/components/form/cover-image-field";
import { useUnsavedGuard } from "@/components/page/unsaved-guard";
import { clearDraft, draftStorageKey, readDraft, useDraftAutosave, type StoredDraft } from "@/hooks/use-studio-draft";
import { CurriculumTree, type Selection } from "@/features/courses/curriculum-tree";
import { Inspector } from "@/features/courses/inspector";
import {
  bodyProblem,
  patchBody,
  toContent,
  unsavedLessons,
  type BodyDrafts,
  type LessonBody,
} from "@/features/courses/lesson-body";
import {
  bearsExercise,
  assignIds,
  keepKeys,
  mergeSaved,
  rememberIds,
  toDraft,
  toPayload,
  type Course,
  type DraftChapter,
} from "@/features/courses/types";
import type { ExerciseListItem } from "@codementor/solve";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES, LEVELS, LEVEL_LABELS } from "@/features/roadmaps/types";
import { api, type Tag } from "@/lib/api";
import {
  integer,
  isClean,
  maxLength,
  retitleSlug,
  slug as slugRule,
  text,
  url,
  type FieldError,
} from "@codementor/utils";
import { useEditedIds } from "@/features/review/edited-since-review";

interface Meta {
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  level: string;
  progressionMode: string;
  prerequisiteNote: string;
  tagIds: string[];
}

/**
 * Chữ ký của bản nháp, để biết còn gì chưa lưu.
 *
 * Cây đi qua `toPayload` chứ không so trực tiếp: `toDraft` sinh `key` ngẫu nhiên cho mỗi
 * hàng, nên hai bản sao y hệt nhau vẫn khác chuỗi JSON.
 */
/** Bản nháp cứu hộ trong localStorage. `bodies` chỉ gồm bài chưa lưu; nháp cũ không có nó. */
interface StudioDraft {
  meta: Meta;
  chapters: DraftChapter[];
  bodies?: BodyDrafts;
}

function signature(meta: Meta, chapters: DraftChapter[]): string {
  return JSON.stringify([meta, toPayload(chapters)]);
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
    tagIds: course.tagIds ?? [],
  };
}

export default function CourseStudioPage() {
  const { id } = useParams<{ id: string }>();
  const edited = useEditedIds("courses");
  const router = useRouter();

  const toast = useToast();
  const [tab, setTab] = useState<"curriculum" | "metadata" | "purchases" | "completions">("curriculum");
  const loadCompletions = useCallback((query: CompletionsQuery) => api.completions("course", id, query), [id]);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "purchases" || requested === "metadata" || requested === "completions") setTab(requested);
  }, []);
  const [course, setCourse] = useState<Course | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [chapters, setChapters] = useState<DraftChapter[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [exercises, setExercises] = useState<ExerciseListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Từ vựng chủ đề để gợi ý. Hỏng thì thôi không hiện ô chọn — soạn nội dung không dừng
  // lại vì một từ vựng phụ không tải được.
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.tags
      .list()
      .then((loaded) => !cancelled && setTags(loaded))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const createTag = async (name: string) => {
    const created = await api.tags.create(name);
    // Đưa ngay vào từ vựng tại chỗ: không chờ tải lại thì chip mới vẫn có tên để hiện, và
    // lần gõ sau đã thấy nó trong gợi ý.
    setTags((current) =>
      current.some((tag) => tag.id === created.id)
        ? current
        : [...current, created].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    );
    return created;
  };

  const { scheduleDelete } = useUndoableDelete();
  const [savedSignature, setSavedSignature] = useState("");
  // Cây TRƯỚC lần lưu, để `apply` giữ nguyên khoá của từng hàng — xem `keepKeys`. Ref
  // riêng vì `apply` phải giữ chữ ký ổn định ([] deps) để không tạo lại mỗi lần render.
  const chaptersRef = useRef<DraftChapter[]>([]);
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);
  // Thân bài theo khoá của từng bài. Ở đây chứ không ở Inspector để đổi bài không mất gì,
  // và để một lần "Lưu" ghi được mọi bài đã sửa.
  const [bodies, setBodies] = useState<BodyDrafts>({});
  const loadBody = useCallback(
    (key: string, body: LessonBody) =>
      setBodies((current) => (current[key] ? current : { ...current, [key]: { ...body, dirty: false } })),
    [],
  );
  const patchLessonBody = useCallback(
    (key: string, partial: Partial<LessonBody>, edited?: boolean) =>
      setBodies((current) => patchBody(current, key, partial, edited)),
    [],
  );
  // Nháp phát hiện trong localStorage lúc mở trang, còn chờ người dùng chọn khôi phục
  // hay bỏ qua — xem effect nạp khóa học bên dưới và ô thoại render ở cuối component.
  const [pendingDraft, setPendingDraft] = useState<StoredDraft<StudioDraft> | null>(null);

  const apply = useCallback((loaded: Course) => {
    const nextMeta = toMeta(loaded);
    const nextChapters = keepKeys(chaptersRef.current, toDraft(loaded.chapters ?? []));
    setCourse(loaded);
    setMeta(nextMeta);
    setChapters(nextChapters);
    setSavedSignature(signature(nextMeta, nextChapters));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.courses
      .get(id)
      .then((loaded) => {
        if (cancelled) return;
        apply(loaded);
        // Nháp cũ trùng với bản vừa tải thì không hỏi gì cả — dọn luôn cho gọn.
        const draft = readDraft<StudioDraft>(draftStorageKey("course", id));
        if (!draft) return;
        if (
          Object.keys(draft.value.bodies ?? {}).length === 0 &&
          signature(draft.value.meta, draft.value.chapters) === signature(toMeta(loaded), toDraft(loaded.chapters ?? []))
        ) {
          clearDraft(draftStorageKey("course", id));
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
  const unsaved = unsavedLessons(chapters, bodies);
  const dirty =
    Boolean(meta) && (signature(meta as Meta, chapters) !== savedSignature || unsaved.length > 0);
  useDraftAutosave(
    draftStorageKey("course", id),
    {
      meta: meta as Meta,
      chapters,
      bodies: Object.fromEntries(unsaved.map(({ lesson, body }) => [lesson.key, body])),
    },
    { ready: meta !== null, dirty },
  );

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

  // Thao tác đổi trạng thái trả về khóa học để áp vào màn hình. "Lưu" trả `void`: nó tự gộp
  // kết quả, áp lại lần nữa là đè mất những gì vừa sửa trong lúc chờ.
  const run = async (action: () => Promise<Course | void>, done: string) => {
    setSaving(true);
    try {
      const updated = await action();
      if (updated) apply(updated);
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

  // Trước early return: hook phải chạy ở mọi lần render.
  const unsavedDialog = useUnsavedGuard(dirty);
  // Đường lưu đọc bản MỚI NHẤT qua ref: `ensureLessonId` được gọi từ một lượt tải video đã
  // bắt đầu từ nhiều lần render trước, closure của nó giữ cây cũ.
  const latest = useRef({ course, meta, chapters });
  useEffect(() => {
    latest.current = { course, meta, chapters };
  });
  // Id máy chủ đã cấp theo khoá, có ngay khi lưu xong, trước cả lần render kế tiếp.
  const savedIds = useRef(new Map<string, string>());
  // Các lượt lưu cây xếp hàng: hai lượt song song cùng gửi một bài chưa có id là tạo trùng.
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

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

  /**
   * Đổi tiêu đề thì slug đi theo — xem `retitleSlug`. Khóa đã công khai thì KHÔNG đụng
   * vào slug: backend từ chối đổi, và một ô disabled tự nhảy chữ chỉ làm người soạn tưởng
   * mình vừa đổi được đường dẫn đã phát ra ngoài.
   */
  const patchTitle = (title: string) =>
    patchMeta({
      title,
      ...(course.status === "published" ? {} : { slug: retitleSlug(meta.slug, meta.title, title) }),
    });

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
    const problem =
      text(chapter.title, 200, `Tiêu đề chương ${chapterIndex + 1}`) ??
      maxLength(chapter.description, 2000, `Mô tả chương ${chapterIndex + 1}`);
    return problem ? [problem] : [];
  })[0];

  // Thân bài: mọi bài đã sửa, cộng bài đang mở (như trước nay).
  const selectedKey = selection?.kind === "lesson" ? selection.lessonKey : null;
  const contentProblem = chapters.flatMap((chapter, chapterIndex) =>
    chapter.lessons.flatMap((lesson, lessonIndex) => {
      const body = bodies[lesson.key];
      if (!body || bearsExercise(lesson.type) || !(body.dirty || lesson.key === selectedKey)) return [];
      const problem = bodyProblem(lesson, body);
      return problem ? [`Chương ${chapterIndex + 1} · Bài ${lessonIndex + 1}: ${problem}`] : [];
    }),
  )[0];

  const blocker = metaValid
    ? (chapterProblem ?? lessonProblem ?? contentProblem)
    : "Còn ô chưa hợp lệ ở tab “Thông tin khóa học”";

  // Metadata trước, cây sau: cây trả về đã kèm số chương/bài do trigger cập nhật, nên
  // nó phải là câu trả lời cuối cùng. Dùng chung cho nút "Lưu" và `ensureLessonId`.
  //
  // Một lượt lưu là đủ: "cho học trước" chỉ là một cờ boolean trên từng bài, không cần
  // id thật ở đầu nào cả (khác điều kiện mở khoá tự chọn trước đây, vốn phải trỏ tới id
  // bài khác nên một bài mới tạo trong CHÍNH lượt lưu này phải chờ lượt thứ hai mới có id
  // để trỏ tới). Backend tự suy toàn bộ cạnh phụ thuộc từ thứ tự chương/bài.
  const writeTree = async () => {
    const { course: stored, meta: sentMeta, chapters: sent } = latest.current;
    if (!stored || !sentMeta) return;
    await api.courses.update(id, {
      ...(sentMeta.slug !== stored.slug ? { slug: sentMeta.slug } : {}),
      title: sentMeta.title,
      description: sentMeta.description || null,
      coverImageUrl: sentMeta.coverImageUrl || null,
      level: sentMeta.level,
      progressionMode: sentMeta.progressionMode,
      prerequisiteNote: sentMeta.prerequisiteNote || null,
      tagIds: sentMeta.tagIds,
    });
    const rows = assignIds(sent, savedIds.current);
    const saved = await api.courses.saveCurriculum(id, toPayload(rows));
    const nextMeta = toMeta(saved);
    const nextChapters = toDraft(saved.chapters ?? []);
    rememberIds(savedIds.current, rows, nextChapters);
    setCourse(saved);
    // Ô nào bị sửa trong lúc chờ thì giữ chữ đang gõ, ô còn lại theo máy chủ.
    setMeta((current) => {
      if (!current || current === sentMeta) return nextMeta;
      const edited = Object.entries(current).filter(
        ([field, value]) => sentMeta[field as keyof Meta] !== value,
      );
      return { ...nextMeta, ...Object.fromEntries(edited) };
    });
    setChapters((current) => mergeSaved(sent, current, nextChapters, savedIds.current));
    setSavedSignature(signature(nextMeta, nextChapters));
  };

  const saveTree = (): Promise<void> => {
    const next = saveQueue.current.catch(() => undefined).then(writeTree);
    saveQueue.current = next;
    return next;
  };

  /**
   * Bài lý thuyết mới tạo chưa có `id` — thân bài lưu ở MongoDB, cần `id` thật trước khi
   * ghi được. Dùng khi soạn thân bài/tải video CHƯA bấm nút "Lưu" chung: người soạn viết
   * ngay, hàm này tự lưu cây trước nếu cần thay vì bắt tự bấm "Lưu" ở đầu trang trước.
   */
  const ensureLessonId = async (lessonKey: string): Promise<string> => {
    const find = () =>
      savedIds.current.get(lessonKey) ??
      latest.current.chapters.flatMap((chapter) => chapter.lessons).find((row) => row.key === lessonKey)?.id;
    // Lượt lưu đang chạy có thể đã mang bài này đi rồi.
    await saveQueue.current.catch(() => undefined);
    if (!find()) await saveTree();
    const lessonId = find();
    if (!lessonId) throw new Error("Không lưu được bài học — thử bấm Lưu ở đầu trang.");
    return lessonId;
  };

  /**
   * Nút "Lưu" chung ở đầu trang: lưu cây/metadata, rồi lưu thân của MỌI bài đã sửa. Chạy SAU
   * khi cây đã lưu xong nên bài mới tạo đã có id.
   */
  const saveEverything = async (): Promise<void> => {
    await saveTree();
    for (const { lesson, body } of unsaved) {
      const lessonId = lesson.id ?? savedIds.current.get(lesson.key);
      if (!lessonId) continue;
      await api.courses.saveLessonContent(id, lessonId, toContent(lesson.type, body));
      // Gõ tiếp trong lúc đang ghi thì bài vẫn còn bẩn, lần "Lưu" sau ghi nốt.
      setBodies((current) =>
        current[lesson.key] === body ? { ...current, [lesson.key]: { ...body, dirty: false } } : current,
      );
    }
  };

  return (
    <>
    {unsavedDialog}
    <BreadcrumbTitle href={`/courses?open=${id}`} slug={id} title={meta.title || course.slug} />
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
              clearDraft(draftStorageKey("course", id));
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
              setMeta(pendingDraft.value.meta);
              setChapters(pendingDraft.value.chapters);
              setBodies(pendingDraft.value.bodies ?? {});
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
        clearDraft(draftStorageKey("course", id));
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
      actions={tab === "purchases" || tab === "completions" ? undefined : (
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
                {/* Đã công khai: chỉ cần gửi lại khi đã lưu thay đổi chưa gửi. */}
                {(course.status !== "published" || edited(id)) && (
                  course.requiresSubmitNote ? (
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
                  )
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
        )}
      backHref="/courses"
      backLabel="Khóa học"
      meta={`${course.totalChapters} chương · ${course.totalLessons} bài · ${
        course.durationHours ? `${course.durationHours} giờ` : "chưa có thời lượng"
      }`}
      rejectionReason={course.status === "pending_review" ? null : course.rejectionReason}
      submissionNote={course.status === "pending_review" ? course.submitNote : null}
      slug={course.slug}
      status={
        <StatusBadge tone={CONTENT_STATUS_TONES[course.status]}>
          {CONTENT_STATUS_LABELS[course.status]}
        </StatusBadge>
      }
      tabs={{
        options: [
          { value: "curriculum", label: "Nội dung" },
          { value: "metadata", label: "Giá, khuyến mãi & thông tin" },
          { value: "purchases", label: "Học viên đã mua" },
          { value: "completions", label: "Đã hoàn thành" },
        ],
        value: tab,
        onChange: (value) => setTab(value as "curriculum" | "metadata" | "purchases" | "completions"),
      }}
      title={meta.title || "Khóa học chưa đặt tên"}
    >
      {tab === "curriculum" ? (
        // Two panes rather than a fixed 380px column: how much room the inspector needs
        // depends on whether the selected lesson is a one-field chapter or a rich-text
        // body, and only the person editing knows which.
        <StudioSplit
          start={{
            id: "tree",
            defaultSize: "55%",
            minSize: "25%",
            content: (
              <div className="h-full overflow-y-auto p-3">
                <CurriculumTree
                  chapters={chapters}
                  disabled={locked}
                  onChange={setChapters}
                  onSelect={setSelection}
                  selection={selection}
                />
              </div>
            ),
          }}
          end={{
            id: "inspector",
            defaultSize: "45%",
            minSize: "20%",
            content: (
              <div className="h-full overflow-y-auto p-3">
                <Inspector
                  bodies={bodies}
                  chapters={chapters}
                  courseId={id}
                  disabled={locked}
                  ensureLessonId={ensureLessonId}
                  exercises={exercises}
                  loadContent={loadContent}
                  onChange={setChapters}
                  onLoadBody={loadBody}
                  onPatchBody={patchLessonBody}
                  selection={selection}
                />
              </div>
            ),
          }}
        />
      ) : tab === "purchases" ? (
        <StudioScroll>
          <CoursePurchases courseId={course.id} />
        </StudioScroll>
      ) : tab === "completions" ? (
        <StudioScroll>
          <CompletionsPanel load={loadCompletions} verifyBaseUrl={CLIENT_URL} />
        </StudioScroll>
      ) : (
        <StudioScroll>
        <fieldset className="grid min-w-0 gap-4 pb-5 lg:grid-cols-3" disabled={locked}>
          <div className="lg:col-span-3">
            <PriceEditor id={course.id} locked={locked} />
          </div>
          <Card className="min-w-0 p-5 lg:col-span-2">
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
                onChange={(event) => patchTitle(event.target.value)}
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

            <Field counter={{ value: meta.description, max: 5000 }} error={metaErrors.description}
              htmlFor="description" hint="Bắt buộc có để gửi duyệt." label="Mô tả">
              <textarea
                {...fieldA11y("description", metaErrors.description)}
                className={textareaClassName}
                onChange={(event) => patchMeta({ description: event.target.value })}
                value={meta.description}
              />
            </Field>

            <CoverImageField
              contentId={id}
              createUpload={api.courses.coverUploadUrl}
              disabled={locked}
              error={metaErrors.coverImageUrl}
              loadConfig={api.courses.coverUploadConfig}
              onChange={(coverImageUrl) => patchMeta({ coverImageUrl })}
              persist={(coverImageUrl) => api.courses.update(id, { coverImageUrl })}
              title={meta.title}
              value={meta.coverImageUrl}
            />

            <Field counter={{ value: meta.prerequisiteNote, max: 1000 }} error={metaErrors.prerequisiteNote}
              htmlFor="prerequisiteNote" label="Ghi chú điều kiện tiên quyết">
              <textarea
                {...fieldA11y("prerequisiteNote", metaErrors.prerequisiteNote)}
                className={textareaClassName}
                onChange={(event) => patchMeta({ prerequisiteNote: event.target.value })}
                value={meta.prerequisiteNote}
              />
            </Field>
          </Card>

          <Card className="min-w-0 h-fit p-5">
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

            <Field
              hint="Tuần tự: bài mở lần lượt theo thứ tự, trừ bài đánh dấu “Cho học trước”. Tự do: học viên vào bài nào cũng được."
              htmlFor="progressionMode"
              label="Cách mở khóa"
            >
              <select
                className={inputClassName}
                id="progressionMode"
                onChange={(event) => patchMeta({ progressionMode: event.target.value })}
                // Khóa cũ có thể vẫn ở "linear" (giá trị mặc định trước đây) — cùng ý
                // nghĩa với "Tuần tự" bây giờ, lưu lần tới sẽ tự ghi lại thành "graph".
                value={meta.progressionMode === "free" ? "free" : "graph"}
              >
                <option value="graph">Tuần tự</option>
                <option value="free">Tự do</option>
              </select>
            </Field>

            <div className="mt-4">
              <TopicPicker
                hint="Dùng để gợi ý khóa cùng chủ đề cho học viên. Chủ đề của bài tập bên trong khóa được gom thêm tự động."
                onChange={(tagIds) => patchMeta({ tagIds })}
                onCreate={createTag}
                options={tags}
                value={meta.tagIds}
              />
            </div>

            <div className="mt-4">
              <CertificateTemplateSelect subject="course" id={course.id} />
            </div>
          </Card>

          <div className="mt-6 border-t border-border pt-6 lg:col-span-3">
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
