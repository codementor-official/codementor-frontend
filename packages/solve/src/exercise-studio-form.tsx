"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Braces,
  ChevronDown,
  Eye,
  FileText,
  FlaskConical,
  Info,
  Languages,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Wand2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Button, Card, Select, TopicPicker } from "@codementor/ui";
import { CodeEditor } from "@codementor/editor";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  supportsFunctionMode,
  LANGUAGES,
  TYPE_OPTIONS,
  typeKey,
  type ExerciseContent,
  type FunctionSignature,
  type IoMode,
  type LanguageConfig,
  type TestCase,
  type SuggestTestCasesInput,
  type SuggestedTestCase,
  type JudgeRunPayload,
  type JudgeRunResult,
  type JudgeSpecPayload,
  type TypeIR,
} from "./types";
import {
  integer,
  isClean,
  retitleSlug,
  slug as slugRule,
  text,
  type FieldError,
} from "@codementor/utils";

/**
 * Luật kiểm của phần "Thông tin chung", khớp trần của `UpdateExerciseDto` ở backend.
 *
 * Một chỗ duy nhất vì hai nơi cần đúng luật này: form tô đỏ từng ô, còn trang studio khoá
 * nút "Lưu". Tách ra hai bản là để chúng lệch nhau — form báo sai mà nút vẫn bấm được.
 */
export function exerciseBriefErrors(
  draft: ExerciseDraft,
  { slugLocked = false } = {},
): Record<string, FieldError> {
  return {
    title: text(draft.title, 200, "Tiêu đề"),
    // Slug đã khoá thì không phải lỗi của người đang sửa — đừng tô đỏ thứ họ không đổi được.
    slug: slugLocked ? undefined : slugRule(draft.slug),
    summary: draft.summary.trim().length > 500 ? "Tóm tắt tối đa 500 ký tự" : undefined,
    estimatedMinutes: integer(draft.estimatedMinutes, "Thời lượng", { min: 1, max: 100000 }),
    timeLimitMs: integer(draft.timeLimitMs, "Giới hạn thời gian chạy", {
      min: 100,
      max: 60_000,
      optional: false,
    }),
    memoryLimitKb: integer(draft.memoryLimitKb, "Giới hạn bộ nhớ", {
      min: 1024,
      max: 4_194_304,
      optional: false,
    }),
  };
}

/** Câu chặn nút "Lưu", hoặc `undefined` khi mọi ô hợp lệ. */
export function exerciseBriefBlocker(
  draft: ExerciseDraft,
  options?: { slugLocked?: boolean },
): string | undefined {
  return isClean(exerciseBriefErrors(draft, options))
    ? undefined
    : "Còn ô chưa hợp lệ ở “Thông tin chung”";
}

/** Khớp trần phía backend (`MAX_TAGS` trong aggregate Exercise). */
const MAX_TAGS = 8;

export interface ExerciseDraft {
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  /** Id chủ đề đã chọn. Vắng mặt ở nơi soạn bài không có chủ đề (bài tập nhóm). */
  tagIds?: string[];
  estimatedMinutes: string;
  timeLimitMs: string;
  memoryLimitKb: string;
  content: ExerciseContent;
}

export interface TagOption {
  id: string;
  name: string;
}

interface Props {
  value: ExerciseDraft;
  onChange: (next: ExerciseDraft) => void;
  /**
   * Từ vựng chủ đề để gợi ý. KHÔNG truyền thì cả khối chủ đề biến mất — bài tập trong
   * nhóm học tập đi qua một API khác, không có chỗ nào nhận chủ đề, và một ô nhập lưu
   * xong không thấy đâu còn tệ hơn là không có ô nào.
   */
  tagOptions?: TagOption[];
  /**
   * Tạo chủ đề chưa có trong từ vựng. Vắng mặt thì ô nhập chỉ chọn được thứ đã có.
   * Trả về chủ đề đã lưu — trùng tên thì là chủ đề cũ, không phải bản sao.
   */
  onCreateTag?: (name: string) => Promise<TagOption>;
  /** Đang chờ duyệt thì backend từ chối mọi lệnh ghi; khoá ở đây để không gọi vô ích. */
  readOnly?: boolean;
  /** Slug của bài đã công khai không đổi được — đường dẫn đã phát ra ngoài. */
  slugLocked?: boolean;
  theme?: "light" | "dark";
}

/**
 * Gợi ý test case. Tiêm vào giống `judge` chứ không import `api` — `packages/solve` dùng chung
 * cho apps/client và apps/lecturer, và hai app đó có hai đường ra backend khác nhau.
 *
 * Không truyền thì nút gợi ý biến mất. Một nút gọi vào khoảng không còn tệ hơn không có nút.
 */
export interface ExerciseStudioAi {
  suggestTestCases: (
    body: SuggestTestCasesInput,
  ) => Promise<SuggestedTestCase[]>;
}

export interface ExerciseStudioJudge {
  starter: (body: { languages: string[]; spec: JudgeSpecPayload }) => Promise<{
    starters: Record<string, string>;
    unsupported: Record<string, string>;
  }>;
  run: (body: JudgeRunPayload) => Promise<JudgeRunResult>;
}
/**
 * Soạn bài code, chia làm hai nửa vì studio đặt chúng vào hai pane kéo được: bên trái là
 * bài đọc thế nào, bên phải là bài chạy và chấm ra sao.
 *
 * Cả hai đều là component có kiểm soát — state nằm ở trang, form chỉ nhận `value` và phát
 * `onChange`. Đó là điểm khác duy nhất so với bản trong apps/client, vốn giữ state bên trong
 * nên chỉ dựng được giao diện chứ không nối được API.
 */
export function ExerciseBriefForm({
  value,
  onChange,
  tagOptions,
  onCreateTag,
  readOnly = false,
  slugLocked = false,
}: Props) {
  const [previewStatement, setPreviewStatement] = useState(false);
  const errors = exerciseBriefErrors(value, { slugLocked });

  const patch = (partial: Partial<ExerciseDraft>) =>
    onChange({ ...value, ...partial });
  /**
   * Đổi tiêu đề thì slug đi theo — xem `retitleSlug`. Slug đã khoá thì KHÔNG đụng vào:
   * backend từ chối đổi, và một ô disabled tự nhảy chữ chỉ làm người soạn tưởng mình vừa
   * đổi được đường dẫn đã phát ra ngoài.
   */
  const patchTitle = (title: string) =>
    patch({
      title,
      ...(slugLocked ? {} : { slug: retitleSlug(value.slug, value.title, title) }),
    });
  const patchContent = (partial: Partial<ExerciseContent>) =>
    onChange({ ...value, content: { ...value.content, ...partial } });

  return (
    <fieldset className="grid gap-3" disabled={readOnly}>
      <Card className="p-4">
        <CardHeading
          hint="Tên bài, slug và các giới hạn chấm. Đây là phần học viên thấy trước khi mở bài."
          icon={Info}
          title="Thông tin chung"
        />

        <Field
          error={errors.title}
          htmlFor="title"
          label="Tiêu đề"
        >
          <input
            className={inputClassName}
            id="title"
            onChange={(event) => patchTitle(event.target.value)}
            value={value.title}
          />
        </Field>

        <Field
          hint={
            slugLocked
              ? "Đã công khai nên không đổi được — đường dẫn đã phát ra ngoài."
              : "Phần định danh trong đường dẫn. Chỉ đổi được khi chưa công khai."
          }
          error={errors.slug}
          htmlFor="slug"
          label="Slug"
        >
          <input
            className={inputClassName}
            disabled={slugLocked}
            id="slug"
            onChange={(event) => patch({ slug: event.target.value })}
            value={value.slug}
          />
        </Field>

        <Field
          error={errors.summary}
          htmlFor="summary"
          label="Tóm tắt"
          hint="Một dòng hiện ở danh sách."
        >
          <input
            className={inputClassName}
            id="summary"
            onChange={(event) => patch({ summary: event.target.value })}
            value={value.summary}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="difficulty" label="Độ khó">
            <select
              className={inputClassName}
              id="difficulty"
              onChange={(event) => patch({ difficulty: event.target.value })}
              value={value.difficulty}
            >
              {DIFFICULTIES.map((option) => (
                <option key={option} value={option}>
                  {DIFFICULTY_LABELS[option]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            error={errors.estimatedMinutes}
            htmlFor="estimatedMinutes"
            label="Thời lượng ước tính (phút)"
          >
            <input
              className={inputClassName}
              id="estimatedMinutes"
              inputMode="numeric"
              onChange={(event) =>
                patch({ estimatedMinutes: event.target.value })
              }
              value={value.estimatedMinutes}
            />
          </Field>

          <Field
            error={errors.timeLimitMs}
            htmlFor="timeLimitMs"
            hint="100–60000 ms"
            label="Giới hạn thời gian chạy (ms)"
          >
            <input
              className={inputClassName}
              id="timeLimitMs"
              inputMode="numeric"
              onChange={(event) => patch({ timeLimitMs: event.target.value })}
              value={value.timeLimitMs}
            />
          </Field>

          <Field
            error={errors.memoryLimitKb}
            htmlFor="memoryLimitKb"
            hint="1024–4194304 KB"
            label="Giới hạn bộ nhớ (KB)"
          >
            <input
              className={inputClassName}
              id="memoryLimitKb"
              inputMode="numeric"
              onChange={(event) => patch({ memoryLimitKb: event.target.value })}
              value={value.memoryLimitKb}
            />
          </Field>
        </div>

        {tagOptions && (
          <TopicPicker
            hint={
              onCreateTag
                ? "Dùng để gợi ý bài cùng chủ đề cho học viên. Gõ để tìm, Enter để thêm; tên chưa có sẽ được tạo mới."
                : "Dùng để gợi ý bài cùng chủ đề cho học viên. Gõ để tìm, Enter để thêm; chỉ chọn được chủ đề đã có."
            }
            max={MAX_TAGS}
            onChange={(tagIds) => patch({ tagIds })}
            onCreate={onCreateTag}
            options={tagOptions}
            readOnly={readOnly}
            value={value.tagIds ?? []}
          />
        )}

      </Card>

      <Card className="p-4">
        <CardHeading
          action={
            <Button
              onClick={() => setPreviewStatement((shown) => !shown)}
              size="sm"
              type="button"
              variant="outline"
            >
              {previewStatement ? (
                <Pencil className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {previewStatement ? "Soạn" : "Xem trước"}
            </Button>
          }
          className="mb-3"
          hint="Viết bằng Markdown: mô tả bài toán, dạng đầu vào, dạng đầu ra. Ràng buộc có ô riêng bên dưới. Bấm “Xem trước” để đọc như học viên đọc."
          icon={FileText}
          title="Đề bài"
        />

        {previewStatement ? (
          <div className="prose prose-sm max-w-none rounded-lg border p-4 text-sm">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {value.content.statement || "_Chưa có đề bài._"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            aria-label="Đề bài"
            className={`${textareaClassName} min-h-56 font-mono`}
            onChange={(event) =>
              patchContent({ statement: event.target.value })
            }
            placeholder="Markdown. Mô tả bài toán, đầu vào, đầu ra."
            value={value.content.statement ?? ""}
          />
        )}

        {/* Màn giải bài dựng khối "Ràng buộc" từ `content.constraints`, một dòng một gạch
            đầu dòng. Trước đây KHÔNG studio nào ghi được trường đó: chỉ bản nháp AI lẳng
            lặng đổ dữ liệu vào, người soạn không xem cũng không sửa được. Một ô nhiều dòng
            là đủ — mỗi dòng là một ràng buộc. */}
        <LinesField
          label="Ràng buộc — mỗi dòng một ý"
          onChange={(constraints) => patchContent({ constraints })}
          placeholder={"1 <= n <= 10^5\n|a[i]| <= 10^9"}
          readOnly={readOnly}
          value={value.content.constraints ?? []}
        />
      </Card>
    </fieldset>
  );
}

/**
 * Ô nhập một DANH SÁCH dòng.
 *
 * Cùng lý do với `JsonField`: giá trị thật là mảng đã bỏ dòng trống, nhưng nếu lấy thẳng
 * `join("\n")` làm text của ô thì vừa gõ Enter là dòng trống bị cắt ngay và không xuống
 * dòng được. Text nằm ở state cục bộ, chỉ nhận lại từ ngoài khi mảng thật sự đổi.
 */
function LinesField({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const incoming = value.join("\n");
  const [state, setState] = useState({ text: incoming, source: incoming });

  if (incoming !== state.source) setState({ text: incoming, source: incoming });

  const change = (text: string) => {
    const next = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setState({ text, source: next.join("\n") });
    onChange(next);
  };

  return (
    <label className="mt-4 block text-xs text-muted-foreground">
      {label}
      <textarea
        aria-label={label}
        className={`${textareaClassName} mt-1.5 min-h-20 font-mono`}
        disabled={readOnly}
        onChange={(event) => change(event.target.value)}
        placeholder={placeholder}
        value={state.text}
      />
    </label>
  );
}

/**
 * Ô nhập một giá trị JSON.
 *
 * Không dùng thẳng `value` làm text của ô: khi đang gõ, `[1,` chưa phải JSON hợp lệ, mà xoá
 * ký tự của người dùng giữa chừng thì không gõ nổi. Text nằm ở state cục bộ, chỉ đẩy lên trên
 * khi parse được, và chỉ nhận lại text từ ngoài khi giá trị thật sự đổi (ví dụ sau khi sinh
 * đáp án) chứ không phải sau mỗi lần chính mình vừa phát ra.
 */
function JsonField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const incoming = JSON.stringify(value ?? null);
  const [state, setState] = useState({
    text: incoming,
    source: incoming,
    invalid: false,
  });

  if (incoming !== state.source && !state.invalid) {
    setState({ text: incoming, source: incoming, invalid: false });
  }

  const change = (text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      setState({
        text,
        source: JSON.stringify(parsed ?? null),
        invalid: false,
      });
      onChange(parsed);
    } catch {
      setState({ text, source: state.source, invalid: true });
    }
  };

  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <textarea
        className={`${textareaClassName} mt-1.5 min-h-11 font-mono ${
          state.invalid ? "border-destructive" : ""
        }`}
        onChange={(event) => change(event.target.value)}
        rows={1}
        value={state.text}
      />
      {state.invalid && (
        <span className="text-destructive">JSON không hợp lệ</span>
      )}
    </label>
  );
}

const EMPTY_SIGNATURE: FunctionSignature = {
  functionName: "",
  parameters: [],
  returnType: { kind: "int" },
};

/** Bước đầu tiên của quy trình ra đề: mọi thứ sau đó sinh ra từ đây. */
function SignatureCard({
  signature,
  onChange,
}: {
  signature: FunctionSignature;
  onChange: (next: FunctionSignature) => void;
}) {
  const parameters = signature.parameters ?? [];

  const patchParameter = (
    index: number,
    partial: Partial<(typeof parameters)[number]>,
  ) =>
    onChange({
      ...signature,
      parameters: parameters.map((parameter, position) =>
        position === index ? { ...parameter, ...partial } : parameter,
      ),
    });

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Braces aria-hidden="true" className="size-4 shrink-0 text-primary" />
          Chữ ký hàm
          <InfoHint text="Tên hàm, tham số và kiểu trả về mà học viên phải viết. Học viên chỉ điền thân hàm; mã khởi tạo và test case đều sinh theo chữ ký này." />
        </h2>
        <Button
          onClick={() =>
            onChange({
              ...signature,
              parameters: [
                ...parameters,
                { name: `arg${parameters.length + 1}`, type: { kind: "int" } },
              ],
            })
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-3.5" />
          Thêm tham số
        </Button>
      </div>
      <Field
        htmlFor="functionName"
        hint="snake_case. Hệ thống tự đổi sang camelCase cho JavaScript, TypeScript, Java, Go và PHP."
        label="Tên hàm"
      >
        <input
          className={`${inputClassName} font-mono`}
          id="functionName"
          onChange={(event) =>
            onChange({ ...signature, functionName: event.target.value })
          }
          placeholder="solve_quadratic"
          value={signature.functionName}
        />
      </Field>

      {parameters.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
          Chưa có tham số nào.
        </p>
      ) : (
        <div className="mb-4 grid gap-2">
          {parameters.map((parameter, index) => (
            <div className="flex items-end gap-2" key={index}>
              <label className="min-w-0 flex-1 text-xs text-muted-foreground">
                Tên
                <input
                  className={`${inputClassName} mt-1.5 font-mono`}
                  onChange={(event) =>
                    patchParameter(index, { name: event.target.value })
                  }
                  value={parameter.name}
                />
              </label>
              <label className="min-w-0 flex-1 text-xs text-muted-foreground">
                Kiểu
                <select
                  className={`${inputClassName} mt-1.5`}
                  onChange={(event) =>
                    patchParameter(index, {
                      type: TYPE_OPTIONS.find(
                        (option) => option.value === event.target.value,
                      )!.ir,
                    })
                  }
                  value={typeKey(parameter.type)}
                >
                  {TYPE_OPTIONS.filter((option) => option.value !== "void").map(
                    (option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <Button
                aria-label={`Xoá tham số ${parameter.name}`}
                className="shrink-0"
                onClick={() =>
                  onChange({
                    ...signature,
                    parameters: parameters.filter(
                      (_, position) => position !== index,
                    ),
                  })
                }
                size="sm"
                type="button"
                variant="danger"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Field htmlFor="returnType" label="Kiểu trả về">
        <select
          className={inputClassName}
          id="returnType"
          onChange={(event) =>
            onChange({
              ...signature,
              returnType: TYPE_OPTIONS.find(
                (option) => option.value === event.target.value,
              )!.ir,
            })
          }
          value={typeKey(signature.returnType)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
    </Card>
  );
}

/**
 * Khoảng cho phép của một lượt gợi ý. Khớp với `MIN/MAX/DEFAULT_SUGGESTIONS` ở
 * `apps/ai-service/app/suggest.py` — server từ chối con số ngoài khoảng, nên đây chỉ là để
 * không gửi một yêu cầu chắc chắn hỏng.
 *
 * Mặc định 3 chứ không phải 5: đó là số case người soạn duyệt xong trong một hơi.
 */
const MIN_SUGGESTIONS = 1;
const MAX_SUGGESTIONS = 5;
const DEFAULT_SUGGESTIONS = 3;
const SUGGESTION_COUNTS = Array.from(
  { length: MAX_SUGGESTIONS - MIN_SUGGESTIONS + 1 },
  (_, index) => MIN_SUGGESTIONS + index,
);

/** Nửa còn lại: ngôn ngữ kèm mã mẫu, test case, và cách so khớp đầu ra. */
export function ExerciseCodeForm({
  value,
  onChange,
  judge,
  ai,
  readOnly = false,
  theme = "light",
}: Props & { judge: ExerciseStudioJudge; ai?: ExerciseStudioAi }) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  // Gợi ý sống RIÊNG, không chạm vào `value.content.testCases` cho tới khi người soạn bấm
  // giữ. Hai lý do: draft tự lưu, nên thứ chưa duyệt mà rơi vào đó là rác người khác phải
  // dọn; và `rationale` không có chỗ trong `exercise_contents` (validator strict).
  const [suggestions, setSuggestions] = useState<SuggestedTestCase[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestCount, setSuggestCount] = useState(DEFAULT_SUGGESTIONS);
  const [suggestMenuOpen, setSuggestMenuOpen] = useState(false);
  //: languageId → lý do chữ ký này không diễn tả được ở ngôn ngữ đó. Judge quyết định, không
  //  phải client — chỉ judge biết C không có `map`.
  const [unsupported, setUnsupported] = useState<Record<string, string>>({});

  const patchContent = (partial: Partial<ExerciseContent>) =>
    onChange({ ...value, content: { ...value.content, ...partial } });

  const languages = value.content.languages ?? [];
  const testCases = value.content.testCases ?? [];
  const selectedIds = new Set(languages.map((language) => language.id));

  const ioMode: IoMode = value.content.ioMode ?? "stdin_stdout";
  const isFunction = ioMode === "function";
  const signature = value.content.signature ?? EMPTY_SIGNATURE;
  const parameters = signature.parameters ?? [];
  // Chỉ chào ra ngôn ngữ có driver phía judge; chọn ngôn ngữ khác thì bài không chạy được.
  const offered = isFunction
    ? LANGUAGES.filter((language) => supportsFunctionMode(language.id))
    : LANGUAGES;

  const switchMode = (next: IoMode) => {
    if (next === ioMode) return;
    if (next === "stdin_stdout") {
      patchContent({ ioMode: next });
      return;
    }
    // Chuyển sang chế độ hàm thì bỏ ngôn ngữ chưa có driver, thay vì để bài giữ một ngôn ngữ
    // không bao giờ chấm được.
    patchContent({
      ioMode: next,
      signature: value.content.signature ?? EMPTY_SIGNATURE,
      languages: languages.filter((language) =>
        supportsFunctionMode(language.id),
      ),
    });
  };

  /**
   * Xin mã khởi tạo từ judge mỗi khi chữ ký hoặc danh sách ngôn ngữ đổi.
   *
   * Ref chứ không phải dependency: hàm áp kết quả phải đọc được state mới nhất, nhưng đưa nó
   * vào mảng phụ thuộc thì mỗi lần render lại gọi lại API, và mỗi lần gọi lại đổi state —
   * một vòng lặp vô tận.
   */
  const latest = useRef({ value, onChange });
  // Cập nhật trong effect, không trong thân render. Effect chạy sau mỗi lần render, còn lời
  // gọi API bên dưới hoãn 400ms — nên ref luôn mới hơn thời điểm nó được đọc.
  useEffect(() => {
    latest.current = { value, onChange };
  });

  const signatureKey = JSON.stringify(signature);
  const languageKey = languages.map((language) => language.id).join(",");

  useEffect(() => {
    if (!isFunction || !languageKey) return;
    const parsed = JSON.parse(signatureKey) as FunctionSignature;
    if (!parsed.functionName?.trim()) return;

    let cancelled = false;
    // Chữ ký được gõ từng ký tự; không hoãn thì mỗi phím là một request kèm một lần dựng lại
    // mã khởi tạo.
    const timer = setTimeout(() => {
      judge
        .starter({
          languages: languageKey.split(","),
          spec: {
            functionName: parsed.functionName.trim(),
            parameters: parsed.parameters ?? [],
            returnType: parsed.returnType,
          },
        })
        .then((generated) => {
          if (cancelled) return;
          setUnsupported(generated.unsupported ?? {});
          const current = latest.current.value;
          const existing = current.content.languages ?? [];
          const next = existing.map((language) =>
            generated.starters[language.id]
              ? { ...language, starterCode: generated.starters[language.id] }
              : language,
          );
          // Chỉ phát onChange khi thực sự có gì đổi: bằng nhau mà vẫn phát thì effect này tự
          // kích hoạt lại chính nó.
          if (next.some((language, index) => language !== existing[index])) {
            latest.current.onChange({
              ...current,
              content: { ...current.content, languages: next },
            });
          }
        })
        .catch(() => {
          // Sinh mã khởi tạo hỏng không được chặn việc soạn bài; ô preview vẫn hiện bản cũ.
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isFunction, judge, signatureKey, languageKey]);

  const toggleLanguage = (option: LanguageConfig) => {
    if (selectedIds.has(option.id)) {
      patchContent({
        languages: languages.filter((language) => language.id !== option.id),
      });
      return;
    }
    patchContent({ languages: [...languages, { ...option }] });
  };

  const patchLanguage = (id: string, partial: Partial<LanguageConfig>) =>
    patchContent({
      languages: languages.map((language) =>
        language.id === id ? { ...language, ...partial } : language,
      ),
    });

  const patchTestCase = (index: number, partial: Partial<TestCase>) =>
    patchContent({
      testCases: testCases.map((testCase, position) =>
        position === index ? { ...testCase, ...partial } : testCase,
      ),
    });

  const patchArg = (index: number, position: number, next: unknown) => {
    const args = [...(testCases[index].args ?? [])];
    args[position] = next;
    patchTestCase(index, { args });
  };

  const addTestCase = () =>
    patchContent({
      testCases: [
        ...testCases,
        // `order` là int trong validator Mongo và phải bắt đầu từ 1, không phải 0.
        {
          order: testCases.length + 1,
          visibility: "hidden",
          ...(isFunction
            ? {
                args: parameters.map((parameter) =>
                  defaultValueFor(parameter.type),
                ),
              }
            : { input: "", expected: "" }),
        },
      ],
    });

  const removeTestCase = (index: number) =>
    patchContent({
      testCases: testCases
        .filter((_, position) => position !== index)
        .map((testCase, position) => ({ ...testCase, order: position + 1 })),
    });

  /**
   * Chặn trước khi gọi AI. Trả về câu cần hiện, hoặc `null` khi đủ điều kiện.
   *
   * Đề bài rỗng là trường hợp phải chặn cứng: model không từ chối, nó tự nghĩ ra một bài
   * toán rồi sinh đầu vào cho bài toán tưởng tượng đó — và người soạn chỉ phát hiện ra bằng
   * cách tự đọc lại từng case. Server chặn lại lần nữa; đây chỉ là để khỏi tốn một lời gọi.
   */
  const suggestBlocker = (): string | null => {
    if ((value.content.statement ?? "").trim().length < 20)
      return "Cần viết đề bài trước khi gợi ý test case.";
    if (!isFunction) return null;
    if (!signature.functionName.trim())
      return "Cần tên hàm ở phần Chữ ký hàm trước đã.";
    if (parameters.length === 0)
      return "Cần ít nhất một tham số để sinh được đầu vào.";
    return null;
  };

  /**
   * Lấy câu tiếng Việt backend gửi kèm, không phải "Request failed with status 400".
   *
   * Đọc theo hình dạng thay vì `instanceof ApiClientError`: `packages/solve` chưa phụ thuộc
   * `@codementor/api-client`, và thêm một dependency chỉ để đọc một trường thì không đáng.
   */
  const describeError = (cause: unknown, fallback: string): string => {
    const body = (cause as { body?: { message?: unknown } } | null)?.body;
    if (typeof body?.message === "string") return body.message;
    return cause instanceof Error ? cause.message : fallback;
  };

  const suggestTestCases = async (count = suggestCount) => {
    if (!ai) return;
    const blocker = suggestBlocker();
    if (blocker) {
      setSuggestError(blocker);
      setSuggestions([]);
      return;
    }

    // Ô chọn chỉ chào ra 1–5, nhưng kẹp lại vẫn rẻ hơn một round-trip trả về 422.
    const safeCount = Math.min(
      MAX_SUGGESTIONS,
      Math.max(MIN_SUGGESTIONS, Math.round(count)),
    );

    setSuggesting(true);
    setSuggestError(null);
    try {
      const produced = await ai.suggestTestCases({
        statement: value.content.statement!.trim(),
        ioMode,
        ...(isFunction ? { signature } : {}),
        constraints: value.content.constraints ?? [],
        // Gửi case đã có để không nhận lại thứ mình đang nhìn. Chỉ phần đầu vào — đáp án
        // không liên quan gì tới việc nghĩ ra đầu vào mới.
        existing: testCases.map((testCase) =>
          isFunction
            ? { args: testCase.args ?? [] }
            : { input: testCase.input ?? "" },
        ),
        count: safeCount,
      });
      setSuggestions(produced);
      if (produced.length === 0)
        setSuggestError(
          "Chưa nghĩ ra case nào khác với những case đã có. Thử bổ sung ràng buộc vào đề bài.",
        );
    } catch (cause) {
      setSuggestError(describeError(cause, "Không gợi ý được test case"));
    } finally {
      setSuggesting(false);
    }
  };

  /** Giữ một gợi ý: nó thành test case thật, và rời khỏi danh sách chờ duyệt. */
  const acceptSuggestion = (index: number) => {
    const picked = suggestions[index];
    setSuggestions((current) =>
      current.filter((_, position) => position !== index),
    );
    patchContent({
      testCases: [
        ...testCases,
        {
          // `order` là int trong validator Mongo và phải bắt đầu từ 1, không phải 0.
          order: testCases.length + 1,
          visibility: "hidden",
          ...(isFunction
            ? { args: picked.args ?? [] }
            : { input: picked.input ?? "" }),
        },
      ],
    });
  };

  /**
   * Chạy lời giải mẫu qua các `args` đã nhập để lấy `expected`.
   *
   * Gọi thẳng judge chứ không qua một endpoint riêng của exercise-service: giảng viên đã được
   * xác thực, `POST /judge/run` đã nhận code tuỳ ý kèm `args`, và bài chưa lưu cũng chạy được
   * — thêm một vòng qua backend chỉ để làm đúng việc này thì không mua thêm gì.
   */
  const generateExpected = async () => {
    const reference = languages.find(
      (language) =>
        supportsFunctionMode(language.id) && language.referenceSolution?.trim(),
    );
    if (!reference) {
      setGenerateError("Cần lời giải mẫu cho Python trước đã.");
      return;
    }
    if (!signature.functionName.trim()) {
      setGenerateError("Cần tên hàm trước đã.");
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await judge.run({
        language: reference.id,
        sourceCode: reference.referenceSolution!,
        timeLimitMs: Number(value.timeLimitMs) || 1000,
        memoryLimitKb: Number(value.memoryLimitKb) || 262_144,
        // Chữ ký ĐẦY ĐỦ, không chỉ tên hàm: driver của Java, Go, C, C++ khai báo biến theo
        // `parameters`/`returnType`. Thiếu chúng thì nó sinh ra một lời gọi không tham số và
        // bài không dịch được.
        spec: {
          functionName: signature.functionName.trim(),
          parameters: signature.parameters ?? [],
          returnType: signature.returnType,
        },
        // `expected: null` là chỗ giữ chỗ — ta lấy `actual`, không quan tâm verdict.
        testCases: testCases.map((testCase) => ({
          order: testCase.order,
          args: testCase.args ?? [],
          expected: null,
        })),
      });

      const broken = result.cases.filter(
        (caseResult) =>
          caseResult.verdict !== "accepted" &&
          caseResult.verdict !== "wrong_answer",
      );
      if (broken.length > 0) {
        setGenerateError(
          `Lời giải mẫu không chạy được ở case ${broken.map((c) => c.order).join(", ")}: ` +
            (broken[0].stderr || result.consoleOutput || "không rõ lý do"),
        );
      }

      const produced = new Map(
        result.cases.map((caseResult) => [caseResult.order, caseResult]),
      );
      patchContent({
        testCases: testCases.map((testCase) => {
          const caseResult = produced.get(testCase.order);
          if (!caseResult || caseResult.verdict === "runtime_error")
            return testCase;
          try {
            return {
              ...testCase,
              expected: JSON.parse(caseResult.actual),
              generated: true,
            };
          } catch {
            return testCase;
          }
        }),
      });
    } catch (cause) {
      setGenerateError(
        cause instanceof Error ? cause.message : "Không chạy được lời giải mẫu",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <fieldset className="grid gap-3" disabled={readOnly}>
      <Card className="p-4">
        <CardHeading
          hint={
            isFunction
              ? "Học viên chỉ viết thân hàm; hệ thống so sánh giá trị trả về."
              : "Học viên viết cả chương trình, kể cả phần đọc đầu vào; hệ thống so chuỗi in ra."
          }
          icon={Workflow}
          title="Cách ra đề"
        />
        <Select
          label="Cách ra đề"
          onChange={(next) => switchMode(next as IoMode)}
          options={[
            { value: "function", label: "Chữ ký hàm" },
            { value: "stdin_stdout", label: "stdin / stdout (cũ)" },
          ]}
          value={ioMode}
        />
      </Card>

      {isFunction && (
        <SignatureCard
          onChange={(next) => patchContent({ signature: next })}
          signature={signature}
        />
      )}

      <Card className="p-4">
        <CardHeading
          hint={
            "Mỗi ngôn ngữ đã chọn phải có lời giải mẫu thì mới gửi duyệt được." +
            (isFunction
              ? " Chữ ký dùng kiểu ngôn ngữ nào không diễn tả được thì ngôn ngữ đó báo ngay bên dưới."
              : "")
          }
          icon={Languages}
          title="Ngôn ngữ hỗ trợ"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {offered.map((option) => (
            <button
              className={
                selectedIds.has(option.id)
                  ? "rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium"
                  : "rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              }
              key={option.id}
              onClick={() => toggleLanguage(option)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {languages.map((language) => (
          <div className="mb-4 rounded-lg border p-4" key={language.id}>
            <p className="mb-3 text-sm font-medium">{language.label}</p>
            <p className="mb-1.5 text-xs text-muted-foreground">
              {isFunction
                ? "Mã khởi tạo (sinh từ chữ ký, không sửa được)"
                : "Mã khởi tạo cho học viên"}
            </p>
            {isFunction ? (
              // Không cho sửa: mã khởi tạo phải khớp chính xác chữ ký mà driver sẽ gọi. Sửa
              // được là mở đường cho một bài mà học viên không thể nào giải đúng.
              <CodeEditor
                height={150}
                language={language.monaco ?? language.id}
                onChange={() => {}}
                readOnly
                theme={theme}
                value={
                  language.starterCode ||
                  unsupported[language.id] ||
                  "// đang sinh từ chữ ký hàm…"
                }
              />
            ) : (
              <CodeEditor
                height={150}
                language={language.monaco ?? language.id}
                onChange={(code) =>
                  patchLanguage(language.id, { starterCode: code })
                }
                placeholder="// để trống nếu không cần"
                theme={theme}
                value={language.starterCode ?? ""}
              />
            )}
            <p className="mt-3 mb-1.5 text-xs text-muted-foreground">
              {isFunction ? "Lời giải mẫu (chỉ thân hàm)" : "Lời giải mẫu"}
            </p>
            <CodeEditor
              height={180}
              language={language.monaco ?? language.id}
              onChange={(code) =>
                patchLanguage(language.id, { referenceSolution: code })
              }
              theme={theme}
              value={language.referenceSolution ?? ""}
            />
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
            Test case
            <InfoHint
              text={
                "Tối thiểu 3 case, trong đó ít nhất một case công khai để học viên thấy ví dụ." +
                (isFunction
                  ? " Chỉ nhập tham số — bấm “Sinh đáp án” để chạy lời giải mẫu ra kết quả."
                  : "")
              }
            />
          </h2>
          <div className="flex items-center gap-2">
            {ai && (
              <div className="relative">
                <Button
                  aria-expanded={suggestMenuOpen}
                  aria-haspopup="menu"
                  disabled={suggesting}
                  onClick={() => setSuggestMenuOpen((open) => !open)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {suggesting ? (
                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-3.5" />
                  )}
                  {suggesting ? "Đang nghĩ…" : `Gợi ý ${suggestCount} case`}
                  {!suggesting && <ChevronDown aria-hidden="true" className="size-3.5" />}
                </Button>
                {suggestMenuOpen && !suggesting && (
                  <div
                    className="absolute right-0 z-10 mt-1 min-w-36 rounded-lg border bg-background p-1 shadow-lg"
                    role="menu"
                  >
                    {SUGGESTION_COUNTS.map((count) => (
                      <button
                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        key={count}
                        onClick={() => {
                          setSuggestCount(count);
                          setSuggestMenuOpen(false);
                          void suggestTestCases(count);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        Gợi ý {count} case
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isFunction && (
              <Button
                disabled={generating || testCases.length === 0}
                onClick={() => void generateExpected()}
                size="sm"
                type="button"
                variant="outline"
              >
                {generating ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-3.5 animate-spin"
                  />
                ) : (
                  <Wand2 aria-hidden="true" className="size-3.5" />
                )}
                {generating ? "Đang chạy…" : "Sinh đáp án"}
              </Button>
            )}
            <Button
              onClick={addTestCase}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="size-3.5" />
              Thêm
            </Button>
          </div>
        </div>
        {generateError && (
          <p
            className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {generateError}
          </p>
        )}

        {suggestError && (
          <p
            className="mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
            role="alert"
          >
            {suggestError}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="mb-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles aria-hidden="true" className="size-3.5" />
                {suggestions.length} gợi ý — giữ cái nào bạn thấy đúng
              </span>
              <Button
                onClick={() => setSuggestions([])}
                size="sm"
                type="button"
                variant="ghost"
              >
                Bỏ hết
              </Button>
            </div>
            {suggestions.map((suggestion, index) => (
              <div
                className="mt-2 flex items-start gap-2 rounded-md border bg-background p-2.5 first:mt-0"
                key={index}
              >
                <div className="min-w-0 flex-1">
                  <pre className="overflow-x-auto font-mono text-xs">
                    {isFunction
                      ? JSON.stringify(suggestion.args)
                      : suggestion.input}
                  </pre>
                  {suggestion.rationale && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {suggestion.rationale}
                    </p>
                  )}
                </div>
                <Button
                  aria-label={`Giữ gợi ý ${index + 1}`}
                  onClick={() => acceptSuggestion(index)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-3.5" />
                  Giữ
                </Button>
                <Button
                  aria-label={`Bỏ gợi ý ${index + 1}`}
                  onClick={() =>
                    setSuggestions((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            <p className="mt-2 text-xs text-muted-foreground">
              Chỉ là đầu vào. Bấm “Sinh đáp án” sau khi giữ để chạy lời giải mẫu
              ra kết quả.
            </p>
          </div>
        )}

        {testCases.length === 0 && suggestions.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Chưa có test case nào.
          </p>
        )}

        {testCases.map((testCase, index) => (
          <div className="mb-3 rounded-lg border p-4" key={index}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                Case {testCase.order}
                {testCase.generated && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    đáp án do máy sinh
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <Select
                  label={`Phạm vi case ${testCase.order}`}
                  onChange={(visibility) =>
                    patchTestCase(index, {
                      visibility: visibility as TestCase["visibility"],
                    })
                  }
                  options={[
                    { value: "public", label: "Công khai" },
                    { value: "hidden", label: "Ẩn" },
                  ]}
                  value={testCase.visibility}
                />
                <Button
                  aria-label={`Xoá case ${testCase.order}`}
                  onClick={() => removeTestCase(index)}
                  size="sm"
                  type="button"
                  variant="danger"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>

            {isFunction ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {parameters.length === 0 && (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Khai báo tham số ở phần Chữ ký hàm trước.
                  </p>
                )}
                {parameters.map((parameter, position) => (
                  <JsonField
                    key={parameter.name + position}
                    label={`${parameter.name} — ${typeKey(parameter.type)}`}
                    onChange={(next) => patchArg(index, position, next)}
                    value={(testCase.args ?? [])[position] ?? null}
                  />
                ))}
                <JsonField
                  label={`Đáp án — ${typeKey(signature.returnType)}`}
                  onChange={(next) =>
                    // Sửa tay thì hết là "do máy sinh" — badge phải nói đúng nguồn gốc.
                    patchTestCase(index, { expected: next, generated: false })
                  }
                  value={testCase.expected ?? null}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Đầu vào
                  <textarea
                    className={`${textareaClassName} mt-1.5 min-h-20 font-mono`}
                    onChange={(event) =>
                      patchTestCase(index, { input: event.target.value })
                    }
                    value={testCase.input ?? ""}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Đầu ra mong đợi
                  <textarea
                    className={`${textareaClassName} mt-1.5 min-h-20 font-mono`}
                    onChange={(event) =>
                      patchTestCase(index, { expected: event.target.value })
                    }
                    value={
                      typeof testCase.expected === "string"
                        ? testCase.expected
                        : ""
                    }
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <CardHeading
          className="mb-3"
          hint="Quy tắc so sánh kết quả của học viên với đáp án. Chọn sai bộ so khớp là bài đúng vẫn bị chấm sai."
          icon={Scale}
          title="Cách chấm"
        />
        <Field
          htmlFor="checker"
          hint={
            isFunction
              ? "So sánh trên giá trị trả về, không phải trên chuỗi in ra."
              : "So sánh trên chuỗi stdout."
          }
          label="Bộ so khớp"
        >
          <select
            className={inputClassName}
            id="checker"
            onChange={(event) =>
              patchContent({
                evaluation: {
                  ...value.content.evaluation,
                  checker: event.target.value as NonNullable<
                    ExerciseContent["evaluation"]
                  >["checker"],
                },
              })
            }
            value={
              value.content.evaluation?.checker ??
              (isFunction ? "exact" : "trimmed")
            }
          >
            {isFunction ? (
              <>
                <option value="exact">So khớp tuyệt đối</option>
                <option value="float">Số thực, có sai số</option>
                <option value="unordered">Không xét thứ tự</option>
              </>
            ) : (
              <>
                <option value="exact">So khớp tuyệt đối</option>
                <option value="trimmed">Bỏ khoảng trắng thừa</option>
                <option value="float">So sánh số thực</option>
                <option value="custom">Checker riêng</option>
              </>
            )}
          </select>
        </Field>
      </Card>
    </fieldset>
  );
}

function defaultValueFor(type: TypeIR | undefined): unknown {
  switch (type?.kind) {
    case "float":
    case "int":
    case "long":
      return 0;
    case "bool":
      return false;
    case "string":
      return "";
    case "list":
      return [];
    case "map":
      return {};
    default:
      return null;
  }
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label
        className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
        htmlFor={htmlFor}
      >
        {label}
        {hint && <InfoHint text={hint} />}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClassName =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring";
const textareaClassName =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring";

function CardHeading({
  icon: Icon,
  title,
  hint,
  action,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 flex flex-wrap items-center justify-between gap-2 ${className}`}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
        {title}
        {hint && <InfoHint text={hint} />}
      </h2>
      {action}
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  const trigger = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const open = () => {
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return;
    setPosition({
      top: anchor.bottom + 6,
      left: Math.min(
        Math.max(8, anchor.left),
        Math.max(8, window.innerWidth - 272),
      ),
    });
  };
  return (
    <span className="inline-flex align-middle">
      <span
        aria-label={text}
        className="flex cursor-help items-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
        onBlur={() => setPosition(null)}
        onFocus={open}
        onPointerEnter={open}
        onPointerLeave={() => setPosition(null)}
        ref={trigger}
        role="note"
        tabIndex={0}
      >
        <Info aria-hidden="true" className="size-3.5" />
      </span>
      {position !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[70] w-64 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-relaxed font-normal text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            role="tooltip"
            style={{ top: position.top, left: position.left }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
