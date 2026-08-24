"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Braces,
  Eye,
  FileText,
  FlaskConical,
  Info,
  Languages,
  Loader2,
  Pencil,
  Plus,
  Scale,
  Wand2,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Button, Card, Select } from "@codementor/ui";
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
  type JudgeRunPayload,
  type JudgeRunResult,
  type JudgeSpecPayload,
  type TypeIR,
} from "./types";
import { integer, slug as slugRule, text } from "@codementor/utils";

export interface ExerciseDraft {
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  estimatedMinutes: string;
  timeLimitMs: string;
  memoryLimitKb: string;
  content: ExerciseContent;
}

interface Props {
  value: ExerciseDraft;
  onChange: (next: ExerciseDraft) => void;
  /** Đang chờ duyệt thì backend từ chối mọi lệnh ghi; khoá ở đây để không gọi vô ích. */
  readOnly?: boolean;
  /** Slug của bài đã công khai không đổi được — đường dẫn đã phát ra ngoài. */
  slugLocked?: boolean;
  theme?: "light" | "dark";
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
  readOnly = false,
  slugLocked = false,
}: Props) {
  const [previewStatement, setPreviewStatement] = useState(false);

  const patch = (partial: Partial<ExerciseDraft>) =>
    onChange({ ...value, ...partial });
  const patchContent = (partial: Partial<ExerciseContent>) =>
    onChange({ ...value, content: { ...value.content, ...partial } });

  return (
    <fieldset className="grid gap-4" disabled={readOnly}>
      <Card className="p-5">
        <CardHeading
          hint="Tên bài, slug và các giới hạn chấm. Đây là phần học viên thấy trước khi mở bài."
          icon={Info}
          title="Thông tin chung"
        />

        <Field
          error={text(value.title, 200, "Tiêu đề")}
          htmlFor="title"
          label="Tiêu đề"
        >
          <input
            className={inputClassName}
            id="title"
            onChange={(event) => patch({ title: event.target.value })}
            value={value.title}
          />
        </Field>

        <Field
          hint={
            slugLocked
              ? "Đã công khai nên không đổi được — đường dẫn đã phát ra ngoài."
              : "Phần định danh trong đường dẫn. Chỉ đổi được khi chưa công khai."
          }
          // Slug đã khoá thì không phải lỗi của người đang sửa — đừng tô đỏ thứ họ không đổi được.
          error={slugLocked ? undefined : slugRule(value.slug)}
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
          error={
            value.summary.trim().length > 500
              ? "Tóm tắt tối đa 500 ký tự"
              : undefined
          }
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
            error={integer(value.estimatedMinutes, "Thời lượng", {
              min: 1,
              max: 100000,
            })}
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
      </Card>

      <Card className="p-5">
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
          hint="Viết bằng Markdown: mô tả bài toán, ràng buộc đầu vào, dạng đầu ra. Bấm “Xem trước” để đọc như học viên đọc."
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
      </Card>
    </fieldset>
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
    <Card className="p-5">
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

/** Nửa còn lại: ngôn ngữ kèm mã mẫu, test case, và cách so khớp đầu ra. */
export function ExerciseCodeForm({
  value,
  onChange,
  judge,
  readOnly = false,
  theme = "light",
}: Props & { judge: ExerciseStudioJudge }) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
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
  }, [isFunction, signatureKey, languageKey]);

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
    <fieldset className="grid gap-4" disabled={readOnly}>
      <Card className="p-5">
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

      <Card className="p-5">
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

      <Card className="p-5">
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

        {testCases.length === 0 && (
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

      <Card className="p-5">
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
  "min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring";

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
