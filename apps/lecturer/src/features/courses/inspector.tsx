"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  BracketsCurlyIcon as Braces,
  CheckIcon as Check,
  FileTextIcon as FileText,
  InfoIcon as Info,
  CursorClickIcon as MousePointerClick,
  MagnifyingGlassIcon as Search,
  UploadSimpleIcon as Upload,
  VideoCameraIcon as Video,
} from "@phosphor-icons/react/ssr";
import { RichTextEditor } from "@codementor/editor";
import {
  attachPlayer,
  fileDuration,
  formatDuration,
  integer,
  lessonDurationError,
  looksPlayable,
  maxLength,
  minimumLessonMinutes,
  resolveVideo,
  text,
  url,
  type ResolvedVideo,
} from "@codementor/utils";
import { Button, InfoHint, Select, StatusBadge, useToast } from "@codementor/ui";
import { ListPager, ListSearch, usePagedList } from "@/components/page/paged-list";
import { Field, fieldA11y, inputClassName, textareaClassName } from "@/components/form/field";
import {
  LESSON_TYPE_LABELS,
  SELECTABLE_LESSON_TYPES,
  bearsExercise,
  type DraftChapter,
  type DraftLesson,
  type LessonContent,
  type VideoUploadConfig,
} from "@/features/courses/types";
import {
  EMPTY_BODY,
  toBody,
  type BodyDraft,
  type BodyDrafts,
  type LessonBody,
} from "@/features/courses/lesson-body";
import { api } from "@/lib/api";
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
  /** Cần cho đường ký URL tải video: `POST /courses/:id/lessons/:lessonId/video-upload-url`. */
  courseId: string;
  selection: Selection;
  /** Phải nhận hàm cập nhật: video tải xong có thể về sau khi cây đã đổi. */
  onChange: Dispatch<SetStateAction<DraftChapter[]>>;
  disabled?: boolean;
  /** Bài code để gắn vào ô. Chỉ nạp khi thật sự cần — studio không phải màn duyệt bài. */
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  /** Thân bài đã nạp hoặc đang sửa. Trang giữ nó, nên đổi bài không làm mất gì. */
  bodies: BodyDrafts;
  /** Nội dung vừa nạp từ máy chủ — không đè lên bản đang sửa. */
  onLoadBody: (lessonKey: string, body: LessonBody) => void;
  onPatchBody: (lessonKey: string, partial: Partial<LessonBody>, edited?: boolean) => void;
  /** Lưu cây (nếu cần) để một bài mới tạo có `id` thật, rồi trả về id đó. */
  ensureLessonId: (lessonKey: string) => Promise<string>;
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
 * chưa có id. Thân bài đang soạn nằm ở trang cha (`bodies`), và nút "Lưu" của trang ghi
 * cây trước rồi mới ghi thân của mọi bài đã sửa.
 */
export function Inspector({
  chapters,
  courseId,
  selection,
  onChange,
  disabled,
  exercises,
  loadContent,
  bodies,
  onLoadBody,
  onPatchBody,
  ensureLessonId,
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
              counter={{ value: chapter.description, max: 2000 }}
              error={maxLength(chapter.description, 2000, "Mô tả")}
              htmlFor="chapter-description"
              label="Mô tả"
            >
              <textarea
                {...fieldA11y("chapter-description", maxLength(chapter.description, 2000, "Mô tả"))}
                className={textareaClassName}
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

  // Cập nhật theo khoá trên cây MỚI NHẤT: video đang tải của bài này có thể xong sau khi
  // người soạn đã sang bài khác và thêm bớt hàng — ghi cả mảng cũ là xoá mất chúng.
  const patchLesson = (partial: Partial<DraftLesson>) =>
    onChange((current) =>
      current.map((item) => ({
        ...item,
        lessons: item.lessons.map((row) => (row.key === lesson.key ? { ...row, ...partial } : row)),
      })),
    );

  return (
    <LessonInspector
      body={bodies[lesson.key]}
      chapterIndex={chapterIndex}
      courseId={courseId}
      disabled={disabled}
      ensureLessonId={() => ensureLessonId(lesson.key)}
      exercises={exercises}
      key={lesson.key}
      lesson={lesson}
      lessonIndex={lessonIndex}
      loadContent={loadContent}
      onLoadBody={onLoadBody}
      onPatch={patchLesson}
      onPatchBody={onPatchBody}
    />
  );
}

function LessonInspector({
  lesson,
  body,
  onPatch,
  disabled,
  exercises,
  loadContent,
  onLoadBody,
  onPatchBody,
  ensureLessonId,
  chapterIndex,
  lessonIndex,
  courseId,
}: {
  lesson: DraftLesson;
  body: BodyDraft | undefined;
  onPatch: (partial: Partial<DraftLesson>) => void;
  disabled?: boolean;
  exercises: ExerciseListItem[];
  loadContent: (lessonId: string) => Promise<LessonContent | null>;
  onLoadBody: Props["onLoadBody"];
  onPatchBody: Props["onPatchBody"];
  ensureLessonId: () => Promise<string>;
  chapterIndex: number;
  lessonIndex: number;
  courseId: string;
}) {
  // Ô bài code không có thân bài riêng. Bài lý thuyết thì LUÔN soạn được ngay — kể cả
  // trước khi có `id` thật — chỉ việc NẠP nội dung cũ mới cần đợi id (bài mới thì
  // không có gì để nạp).
  const needsContent = !bearsExercise(lesson.type);

  const isVideo = lesson.type === "video";

  const { html, summary, videoUrl, videoSeconds } = body ?? EMPTY_BODY;
  const lessonKey = lesson.key;

  // Chỉ bài đã có `id` TỪ LÚC MỞ panel mới có gì để nạp. Bài được cấp `id` giữa chừng
  // (bấm "Lưu", tải video) đang giữ bản mới nhất ở trang — không có gì để nạp thêm.
  const [storedId] = useState(lesson.id);
  const [loadFailed, setLoadFailed] = useState(false);
  const cached = body !== undefined;
  // Chưa nạp xong thì khoá ô soạn: gõ vào lúc này rồi lưu là ghi đè thân bài trên máy chủ.
  const loaded = cached || !needsContent || !storedId;

  useEffect(() => {
    if (!needsContent || !storedId || cached) return;
    let cancelled = false;
    loadContent(storedId)
      .then((content) => {
        if (!cancelled) onLoadBody(lessonKey, toBody(content));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storedId, needsContent, cached, loadContent, onLoadBody, lessonKey]);

  const setHtml = useCallback(
    (next: string) => onPatchBody(lessonKey, { html: next }),
    [onPatchBody, lessonKey],
  );

  // Đổi nguồn video thì thời lượng đo được của video CŨ lập tức vô nghĩa. Không xoá ở đây
  // là giữ lại một con số thuộc về video khác, và ràng buộc thời lượng sẽ gác nhầm số đó.
  const changeVideoUrl = useCallback(
    (next: string) => onPatchBody(lessonKey, { videoUrl: next, videoSeconds: null }),
    [onPatchBody, lessonKey],
  );

  /*
   * `applyVideoDuration` phải giữ chữ ký ỔN ĐỊNH: nó đi thẳng vào deps của hiệu ứng gắn
   * trình phát ở `VideoPlayer`, nên đổi chữ ký mỗi lần render là dựng lại trình phát
   * YouTube sau từng phím gõ. Giá trị mới nhất vì thế đi qua ref chứ không qua deps.
   */
  const latest = useRef({ durationMinutes: lesson.durationMinutes, onPatch });
  useEffect(() => {
    latest.current = { durationMinutes: lesson.durationMinutes, onPatch };
  });

  /**
   * Đo được thời lượng video thì điền luôn vào ô "Thời lượng (phút)" — người soạn không
   * phải tự bấm máy tính cho một con số mà trình phát vừa nói ra.
   *
   * Chỉ điền khi ô đang trống hoặc ĐANG NGẮN HƠN video: một con số dài hơn là người soạn
   * cố ý cộng thêm thời gian đọc tài liệu/làm bài, và ghi đè nó là xoá một quyết định.
   */
  const applyVideoDuration = useCallback(
    (seconds: number) => {
      onPatchBody(lessonKey, { videoSeconds: seconds }, false);
      const { durationMinutes, onPatch: patch } = latest.current;
      const needed = minimumLessonMinutes(seconds);
      const current = durationMinutes.trim() ? Number(durationMinutes) : null;
      if (current === null || !Number.isFinite(current) || current < needed) {
        patch({ durationMinutes: String(needed) });
      }
    },
    [onPatchBody, lessonKey],
  );

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
                disabled={!loaded}
                id="lesson-summary"
                onChange={(event) => onPatchBody(lessonKey, { summary: event.target.value })}
                value={summary}
              />
            </Field>

            {isVideo ? (
              <VideoSourcePicker
                courseId={courseId}
                disabled={disabled || !loaded}
                durationSeconds={videoSeconds}
                ensureLessonId={ensureLessonId}
                lessonId={lesson.id}
                lessonMinutes={lesson.durationMinutes.trim() ? Number(lesson.durationMinutes) : null}
                loaded={loaded}
                onChange={changeVideoUrl}
                onDuration={applyVideoDuration}
                onUseVideoDuration={(minutes) => onPatch({ durationMinutes: String(minutes) })}
                value={videoUrl}
              />
            ) : (
              <div>
                <p className="mb-1.5 text-sm font-medium">Thân bài</p>
                {loaded ? (
                  <RichTextEditor onChange={setHtml} value={html} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {loadFailed
                      ? "Không tải được nội dung bài. Chọn lại bài này để thử lại."
                      : "Đang tải nội dung…"}
                  </p>
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
  durationSeconds,
  onDuration,
  lessonMinutes,
  onUseVideoDuration,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  loaded: boolean;
  courseId: string;
  lessonId: string | undefined;
  ensureLessonId: () => Promise<string>;
  durationSeconds: number | null;
  onDuration: (seconds: number) => void;
  lessonMinutes: number | null;
  onUseVideoDuration: (minutes: number) => void;
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
      // Đo TRƯỚC khi tải lên, từ tệp trong máy — xem `fileDuration`. Đợi khung xem trước
      // đọc hộ là phụ thuộc vào việc bucket có cho đọc công khai hay không, và bucket
      // riêng tư thì ô "Thời lượng (phút)" sẽ đứng im mãi.
      const seconds = await fileDuration(file);

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
      // SAU `onChange`: đổi nguồn video sẽ xoá thời lượng cũ (xem `changeVideoUrl`), nên
      // ghi con số mới trước nó là ghi vào chỗ sắp bị dọn.
      if (seconds !== null) onDuration(seconds);
      toast.success("Đã tải video lên. Bấm “Lưu” để gắn vào bài học.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Tải video lên thất bại");
    } finally {
      setPercent(null);
    }
  };

  // `resolveVideo` dựng một đối tượng MỚI mỗi lần render. Không ghi nhớ thì hiệu ứng gắn
  // trình phát ở `VideoPlayer` chạy lại sau từng phím gõ, và mỗi lần chạy lại là một lần
  // dựng lại trình phát YouTube.
  const resolved = useMemo(() => resolveVideo(value), [value]);
  const durationError = lessonDurationError(lessonMinutes, durationSeconds);

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
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Xem trước</p>
          {value.trim() !== "" && (
            <button
              className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
              disabled={disabled || percent !== null}
              // Chỉ bỏ THAM CHIẾU tới video, tệp vẫn nằm lại trong kho: chưa có đường xoá
              // đối tượng nào ở backend. Đổi lại, bấm nhầm không mất tệp của người khác
              // đang trỏ tới cùng khoá đó.
              onClick={() => onChange("")}
              type="button"
            >
              Xóa video
            </button>
          )}
        </div>
        {resolved === null ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {value.trim() ? "URL không hợp lệ." : "Chưa có video."}
          </p>
        ) : (
          <div className="grid gap-2">
            <VideoPlayer onDuration={onDuration} video={resolved} />
            {durationSeconds === null ? (
              // Không đọc được thời lượng thì KHÔNG chặn lưu — nói ra để người soạn tự canh
              // con số, thay vì im lặng bỏ qua một ràng buộc mà họ tưởng đang có hiệu lực.
              <p className="text-xs text-muted-foreground">
                Chưa đọc được thời lượng video, nên chưa đối chiếu được với thời lượng bài.
                Đợi khung trên tải xong, hoặc tự canh cho thời lượng bài dài hơn video.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Thời lượng video: <strong>{formatDuration(durationSeconds)}</strong>
              </p>
            )}
            {durationError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
                <p className="text-xs text-destructive">{durationError}</p>
                <button
                  className="mt-1.5 text-xs font-semibold text-primary hover:underline"
                  onClick={() => onUseVideoDuration(minimumLessonMinutes(durationSeconds!))}
                  type="button"
                >
                  Đặt thời lượng bài thành {minimumLessonMinutes(durationSeconds!)} phút
                </button>
              </div>
            )}
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
function VideoPlayer({
  video,
  onDuration,
}: {
  video: ResolvedVideo;
  onDuration: (seconds: number) => void;
}) {
  const fileRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Chính khung xem trước này là thứ đo thời lượng — không dựng thêm một trình phát ẩn.
  // Với YouTube/Vimeo thì đo bằng cách nào khác cũng không được: chỉ SDK của họ mới trả
  // lời được, và SDK phải bám vào một iframe có thật trên trang.
  useEffect(() => {
    const element = video.kind === "file" ? fileRef.current : frameRef.current;
    if (!element) return;
    const player = attachPlayer(element, video, { onDuration });
    return () => player.destroy();
  }, [video, onDuration]);

  if (video.kind === "file") {
    return (
      <video
        className="w-full rounded-lg border bg-ink-fixed"
        controls
        preload="metadata"
        ref={fileRef}
        src={video.src}
      />
    );
  }
  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-lg border"
      ref={frameRef}
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
                  {active && <Check aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
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
