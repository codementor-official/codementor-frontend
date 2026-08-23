"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Braces,
  Check,
  FileText,
  Info,
  MousePointerClick,
  Search,
  Upload,
  Video,
} from "lucide-react";
import { RichTextEditor } from "@codementor/editor";
import { integer, looksPlayable, resolveVideo, text, url, type ResolvedVideo } from "@codementor/utils";
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
  type VideoUploadConfig,
} from "@/features/courses/types";
import { api } from "@/lib/api";
import type { Selection } from "@/features/courses/curriculum-tree";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type ExerciseListItem,
} from "@codementor/solve";

/** Cho trang cha gọi hàm lưu thân bài đang mở, từ nút "Lưu" chung ở đầu trang. */
export type ContentSaveRef = { current: ((lessonId: string) => Promise<void>) | null };

interface Props {
  chapters: DraftChapter[];
  /** Cần cho đường ký URL tải video: `POST /courses/:id/lessons/:lessonId/video-upload-url`. */
  courseId: string;
  selection: Selection;
  onChange: (chapters: DraftChapter[]) => void;
  disabled?: boolean;
  /** Bài code để gắn vào ô. Chỉ nạp khi thật sự cần — studio không phải màn duyệt bài. */
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  saveContent: (lessonId: string, content: LessonContent) => Promise<void>;
  /** Lưu cây (nếu cần) để một bài mới tạo có `id` thật, rồi trả về id đó. */
  ensureLessonId: (chapterIndex: number, lessonIndex: number) => Promise<string>;
  /**
   * Studio chỉ còn MỘT nút "Lưu" ở đầu trang. Bài đang mở (nếu có thân bài) đăng ký hàm
   * lưu của nó vào đây khi mount, gỡ khi unmount/đổi bài — nút "Lưu" gọi nó sau khi lưu
   * cây xong, với `lessonId` thật vừa có được. `null` khi mục đang chọn không có thân bài
   * (chương, hoặc ô bài code).
   */
  contentSaveRef: ContentSaveRef;
  /** Lỗi ở thân bài đang mở (ví dụ URL video sai), để nút "Lưu" chung khoá lại đúng lúc. */
  onContentBlockerChange: (blocker: string | undefined) => void;
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
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  /** Riêng với fieldset bao ngoài: có ô mất tác dụng vì lý do khác (chương đầu tiên,
   * chương chưa có bài) chứ không phải vì cả trang đang khoá. */
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2 hover:bg-muted/40">
      <label
        className={`flex min-w-0 flex-1 items-center gap-2.5 text-sm ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        <input
          checked={checked}
          className="size-4 shrink-0 accent-primary"
          disabled={disabled}
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
 * MongoDB và chỉ ghi được khi bài đã có `id` thật. Soạn thì soạn được ngay dù bài còn
 * chưa có id — `LessonInspector.persist` tự lưu cây trước nếu cần (xem `ensureLessonId`),
 * người soạn không phải tự bấm "Lưu" ở đầu trang trước khi viết.
 */
export function Inspector({
  chapters,
  courseId,
  selection,
  onChange,
  disabled,
  exercises,
  loadContent,
  saveContent,
  ensureLessonId,
  contentSaveRef,
  onContentBlockerChange,
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
            <Field
              error={text(chapter.title, 200, "Tiêu đề chương")}
              htmlFor="chapter-title"
              label="Tiêu đề chương"
            >
              <input
                className={inputClassName}
                id="chapter-title"
                onChange={(event) => patchChapter({ title: event.target.value })}
                value={chapter.title}
              />
            </Field>

            <Field
              error={chapter.description.trim().length > 2000 ? "Mô tả tối đa 2000 ký tự" : undefined}
              htmlFor="chapter-description"
              label="Mô tả"
            >
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

            <ToggleRow
              checked={chapter.lessons[0]?.isPreview ?? false}
              disabled={chapter.lessons.length === 0}
              hint={
                chapter.lessons.length === 0
                  ? "Thêm bài vào chương rồi mới đặt được."
                  : "Ai cũng vào được chương này ngay, kể cả chưa ghi danh khóa học — không cần hoàn thành chương trước đó."
              }
              label="Cho học trước"
              onChange={(checked) =>
                patchChapter({
                  lessons: chapter.lessons.map((lesson, index) =>
                    index === 0 ? { ...lesson, isPreview: checked } : lesson,
                  ),
                })
              }
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
      chapterIndex={chapterIndex}
      contentSaveRef={contentSaveRef}
      courseId={courseId}
      disabled={disabled}
      ensureLessonId={() => ensureLessonId(chapterIndex, lessonIndex)}
      exercises={exercises}
      key={lesson.key}
      lesson={lesson}
      lessonIndex={lessonIndex}
      loadContent={loadContent}
      onContentBlockerChange={onContentBlockerChange}
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
  ensureLessonId,
  chapterIndex,
  lessonIndex,
  courseId,
  contentSaveRef,
  onContentBlockerChange,
}: {
  lesson: DraftLesson;
  onPatch: (partial: Partial<DraftLesson>) => void;
  disabled?: boolean;
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  saveContent: (lessonId: string, content: LessonContent) => Promise<void>;
  ensureLessonId: () => Promise<string>;
  chapterIndex: number;
  lessonIndex: number;
  courseId: string;
  contentSaveRef: ContentSaveRef;
  onContentBlockerChange: (blocker: string | undefined) => void;
}) {
  // Ô bài code không có thân bài riêng. Bài lý thuyết thì LUÔN soạn được ngay — kể cả
  // trước khi có `id` thật — chỉ việc NẠP nội dung cũ mới cần đợi id (bài mới thì
  // không có gì để nạp).
  const needsContent = !bearsExercise(lesson.type);

  const isVideo = lesson.type === "video";

  const [html, setHtml] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  // Component được key theo `lesson.key` nên nó remount mỗi lần đổi bài; giá trị khởi
  // tạo này vì thế luôn đúng với bài đang chọn.
  const [loaded, setLoaded] = useState(!needsContent || !lesson.id);

  useEffect(() => {
    if (!needsContent || !lesson.id) return;
    let cancelled = false;
    loadContent(lesson.id)
      .then((content) => {
        if (cancelled) return;
        setHtml(content?.contentHtml ?? "");
        setSummary(content?.summary ?? "");
        setVideoUrl(content?.media?.url ?? "");
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson.id, needsContent, loadContent]);

  /** Thứ đang chặn lưu thân bài, hoặc `undefined` khi lưu được. */
  const contentBlocker = needsContent
    ? ((isVideo ? url(videoUrl, "URL video") : undefined) ??
      (summary.trim().length > 2000 ? "Tóm tắt tối đa 2000 ký tự" : undefined))
    : undefined;

  // Bài video ghi `media`, bài lý thuyết ghi `contentHtml`. Gửi cả hai trong mọi trường
  // hợp sẽ ghi đè thân bài cũ bằng chuỗi rỗng khi người soạn đổi một bài lý thuyết sang
  // video rồi đổi ngược lại. `lessonId` do trang cha truyền vào — studio chỉ còn một nút
  // "Lưu" ở đầu trang, gọi hàm này SAU KHI cây đã lưu xong nên id lúc này luôn có thật.
  const persist = useCallback(
    async (lessonId: string) => {
      await saveContent(lessonId, {
        summary: summary || undefined,
        ...(isVideo
          ? { ...(videoUrl.trim() ? { media: { url: videoUrl.trim() } } : {}) }
          : { contentHtml: html }),
      });
    },
    [saveContent, isVideo, videoUrl, summary, html],
  );

  // Đăng ký hàm lưu thân bài của MỤC ĐANG MỞ vào ref của trang cha, để nút "Lưu" chung
  // gọi được. Component này remount mỗi lần đổi bài (key={lesson.key}), nên cleanup ở
  // đây đã đủ để gỡ đăng ký khi chuyển sang bài khác hoặc không có thân bài để lưu.
  useEffect(() => {
    if (!needsContent) {
      contentSaveRef.current = null;
      onContentBlockerChange(undefined);
      return;
    }
    contentSaveRef.current = persist;
    onContentBlockerChange(contentBlocker);
    return () => {
      contentSaveRef.current = null;
      onContentBlockerChange(undefined);
    };
  }, [needsContent, persist, contentBlocker, contentSaveRef, onContentBlockerChange]);

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
        // Đánh số đúng như học viên thấy ở mục lục. Không có nó thì người soạn phải tự
        // đếm để biết mình đang sửa bài nào khi đặt điều kiện mở khoá cho bài khác.
        title={`Chương ${chapterIndex + 1} · Bài ${lessonIndex + 1}`}
      >
        <div className="grid gap-4">
          <Field
            error={text(lesson.title, 200, "Tiêu đề bài")}
            htmlFor="lesson-title"
            label="Tiêu đề bài"
          >
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

            <Field
              error={integer(lesson.durationMinutes, "Thời lượng", { min: 1, max: 100000 })}
              htmlFor="lesson-duration"
              label="Thời lượng (phút)"
            >
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
              checked={lesson.isOptional}
              hint="Học viên bỏ qua được mà khóa học vẫn tính là hoàn thành."
              label="Bài tùy chọn"
              onChange={(checked) => onPatch({ isOptional: checked })}
            />
            <ToggleRow
              checked={lesson.isPreview}
              hint="Ai cũng xem được ngay, kể cả chưa ghi danh khóa học, và không cần hoàn thành bài liền trước."
              label="Cho học trước"
              onChange={(checked) => onPatch({ isPreview: checked })}
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
      ) : (
        <PanelSection
          icon={isVideo ? Video : FileText}
          title={isVideo ? "Video bài học" : "Nội dung bài"}
        >
          <div className="grid gap-4">
            <Field
              error={summary.trim().length > 2000 ? "Tóm tắt tối đa 2000 ký tự" : undefined}
              htmlFor="lesson-summary"
              hint="Một dòng hiện ở đầu bài học."
              label="Tóm tắt"
            >
              <input
                className={inputClassName}
                id="lesson-summary"
                onChange={(event) => setSummary(event.target.value)}
                value={summary}
              />
            </Field>

            {isVideo ? (
              <VideoSourcePicker
                courseId={courseId}
                disabled={disabled}
                ensureLessonId={ensureLessonId}
                lessonId={lesson.id}
                loaded={loaded}
                onChange={setVideoUrl}
                value={videoUrl}
              />
            ) : (
              <div>
                <p className="mb-1.5 text-sm font-medium">Thân bài</p>
                {loaded ? (
                  <RichTextEditor onChange={setHtml} value={html} />
                ) : (
                  <p className="text-sm text-muted-foreground">Đang tải nội dung…</p>
                )}
              </div>
            )}
          </div>
        </PanelSection>
      )}
    </fieldset>
  );
}

/**
 * Nguồn video của một bài: tải tệp lên kho, hoặc dán URL có sẵn.
 *
 * Hai đường ra CÙNG một chỗ — một chuỗi URL trong `media.url`. Tải lên không phải một
 * loại nội dung khác, nó chỉ là cách để có được URL. Nhờ vậy không có nhánh nào ở màn
 * học viên phải biết video đến từ đâu, và tắt tính năng tải lên (khi chưa cấu hình S3)
 * không làm hỏng bất cứ bài nào đã soạn.
 *
 * Tệp đi THẲNG từ trình duyệt tới kho bằng URL ký sẵn. Dùng `XMLHttpRequest` chứ không
 * `fetch` cho đúng một lý do: `fetch` không báo tiến độ tải LÊN, và một thanh tiến độ là
 * thứ bắt buộc phải có khi người dùng ngồi đợi vài trăm MB.
 */
function VideoSourcePicker({
  value,
  onChange,
  disabled,
  loaded,
  courseId,
  lessonId,
  ensureLessonId,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  loaded: boolean;
  courseId: string;
  lessonId: string | undefined;
  ensureLessonId: () => Promise<string>;
}) {
  const toast = useToast();
  const [config, setConfig] = useState<VideoUploadConfig | null>(null);
  const [percent, setPercent] = useState<number | null>(null);

  // Hỏi một lần mỗi lần mở panel. Hỏng thì coi như chưa cấu hình — ô dán URL vẫn dùng
  // được, và đó là lý do cả màn hình này không có nhánh lỗi nào khác.
  useEffect(() => {
    let cancelled = false;
    api.courses
      .videoUploadConfig()
      .then((result) => !cancelled && setConfig(result))
      .catch(() => !cancelled && setConfig({ enabled: false, maxBytes: 0, acceptedTypes: [] }));
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = async (file: File) => {
    if (!config?.enabled) return;
    if (file.size > config.maxBytes) {
      toast.error(`Video tối đa ${Math.round(config.maxBytes / 1024 / 1024)} MB`);
      return;
    }
    if (!config.acceptedTypes.includes(file.type)) {
      toast.error(`Định dạng ${file.type || "này"} không phát được. Dùng MP4, WebM, OGG hoặc MOV.`);
      return;
    }

    setPercent(0);
    try {
      // Bài chưa lưu lần nào chưa có id thật, mà khoá đối tượng lại mang id đó — lưu cây
      // trước, đúng như nút "Lưu nội dung bài" vẫn làm.
      const id = lessonId ?? (await ensureLessonId());
      const signed = await api.courses.videoUploadUrl(courseId, id, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", signed.uploadUrl);
        for (const [header, headerValue] of Object.entries(signed.headers)) {
          request.setRequestHeader(header, headerValue);
        }
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) setPercent(Math.round((event.loaded / event.total) * 100));
        };
        request.onload = () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : // Kho từ chối là lỗi hay gặp nhất ở bước này, và gần như luôn là CORS chưa
              // mở cho origin của studio. Nói ra thay vì chỉ hiện một mã số.
              reject(
                new Error(
                  `Kho lưu trữ từ chối (HTTP ${request.status}). Kiểm tra cấu hình CORS của bucket.`,
                ),
              );
        request.onerror = () =>
          reject(new Error("Không kết nối được tới kho lưu trữ. Kiểm tra CORS của bucket."));
        request.send(file);
      });

      onChange(signed.publicUrl);
      toast.success("Đã tải video lên. Bấm “Lưu nội dung bài” để gắn vào bài học.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Tải video lên thất bại");
    } finally {
      setPercent(null);
    }
  };

  const resolved = resolveVideo(value);

  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-1.5 text-sm font-medium">Tải video lên</p>
        {config === null ? (
          <p className="text-sm text-muted-foreground">Đang kiểm tra kho lưu trữ…</p>
        ) : config.enabled ? (
          <div className="grid gap-2">
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm transition-colors hover:bg-muted/40 ${
                disabled || percent !== null ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload aria-hidden="true" className="size-4" />
              {percent !== null ? `Đang tải lên… ${percent}%` : "Chọn tệp video"}
              <input
                accept={config.acceptedTypes.join(",")}
                className="hidden"
                disabled={disabled || percent !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Xoá giá trị input để chọn LẠI đúng tệp vừa rồi vẫn kích hoạt onChange
                  // — nếu không, một lần tải hỏng là không thử lại được tệp đó nữa.
                  event.target.value = "";
                  if (file) void upload(file);
                }}
                type="file"
              />
            </label>
            {percent !== null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tối đa {Math.round(config.maxBytes / 1024 / 1024)} MB · MP4, WebM, OGG, MOV
            </p>
          </div>
        ) : (
          // Chưa cấu hình kho KHÔNG được là một màn hình lỗi: ô dán URL ngay dưới vẫn
          // dùng được bình thường, và bài video vẫn soạn xong được.
          <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
            Kho lưu trữ video chưa được cấu hình, nên chưa tải tệp lên được. Dùng ô “URL
            video” bên dưới, hoặc điền các biến <code>S3_*</code> trong{" "}
            <code>codementor-backend/.env</code>.
          </p>
        )}
      </div>

      <Field
        error={url(value, "URL video")}
        htmlFor="lesson-video-url"
        hint="Dán link YouTube, Vimeo hoặc một tệp .mp4/.webm. Tải lên ở trên cũng điền vào đây."
        label="URL video"
      >
        <input
          className={inputClassName}
          id="lesson-video-url"
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://"
          value={loaded ? value : ""}
        />
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-medium">Xem trước</p>
        {resolved === null ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {value.trim() ? "URL không hợp lệ." : "Chưa có video."}
          </p>
        ) : (
          <div className="grid gap-2">
            <VideoPlayer video={resolved} />
            {!looksPlayable(resolved) && (
              <p className="text-xs text-muted-foreground">
                URL này không có đuôi tệp video quen thuộc. Nếu khung trên không phát được,
                kiểm tra lại đường dẫn.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Cùng cách phát mà màn học viên dùng — xem `resolveVideo`. Hai bên phải vẽ giống hệt
 * nhau, nếu không thì thứ giảng viên xem trước không phải thứ học viên nhận.
 */
function VideoPlayer({ video }: { video: ResolvedVideo }) {
  if (video.kind === "file") {
    return (
      <video className="w-full rounded-lg border bg-black" controls preload="metadata" src={video.src} />
    );
  }
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-lg border"
      src={video.src}
      title="Xem trước video bài học"
    />
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
