"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Button, Card, Select } from "@codementor/ui";
import { CodeEditor } from "@codementor/editor";
import { Field, inputClassName, textareaClassName } from "@/components/form/field";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  LANGUAGES,
  type ExerciseContent,
  type LanguageConfig,
  type TestCase,
} from "@/features/exercises/types";

export interface ExerciseDraft {
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
  theme?: "light" | "dark";
}

/**
 * Bản có kiểm soát của form soạn bài bên apps/web.
 *
 * Bản gốc giữ toàn bộ trạng thái bên trong và không có `onSave`, nên nó chỉ dựng được
 * giao diện chứ không nối được vào API. Ở đây state nằm ở trang, form chỉ nhận `value`
 * và phát `onChange` — đó là điểm khác duy nhất về kiến trúc, phần trình bày giữ nguyên.
 */
export function CodeProblemForm({ value, onChange, readOnly = false, theme = "light" }: Props) {
  const [previewStatement, setPreviewStatement] = useState(false);

  const patch = (partial: Partial<ExerciseDraft>) => onChange({ ...value, ...partial });
  const patchContent = (partial: Partial<ExerciseContent>) =>
    onChange({ ...value, content: { ...value.content, ...partial } });

  const languages = value.content.languages ?? [];
  const testCases = value.content.testCases ?? [];
  const selectedIds = new Set(languages.map((language) => language.id));

  const toggleLanguage = (option: LanguageConfig) => {
    if (selectedIds.has(option.id)) {
      patchContent({ languages: languages.filter((language) => language.id !== option.id) });
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

  const addTestCase = () =>
    patchContent({
      testCases: [
        ...testCases,
        // `order` là int trong validator Mongo và phải bắt đầu từ 1, không phải 0.
        { order: testCases.length + 1, input: "", expected: "", visibility: "hidden" },
      ],
    });

  const removeTestCase = (index: number) =>
    patchContent({
      testCases: testCases
        .filter((_, position) => position !== index)
        .map((testCase, position) => ({ ...testCase, order: position + 1 })),
    });

  return (
    <fieldset className="grid gap-4" disabled={readOnly}>
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">Thông tin chung</h2>

        <Field htmlFor="title" label="Tiêu đề">
          <input
            className={inputClassName}
            id="title"
            onChange={(event) => patch({ title: event.target.value })}
            value={value.title}
          />
        </Field>

        <Field htmlFor="summary" label="Tóm tắt" hint="Một dòng hiện ở danh sách.">
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

          <Field htmlFor="estimatedMinutes" label="Thời lượng ước tính (phút)">
            <input
              className={inputClassName}
              id="estimatedMinutes"
              inputMode="numeric"
              onChange={(event) => patch({ estimatedMinutes: event.target.value })}
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

          <Field htmlFor="memoryLimitKb" hint="1024–4194304 KB" label="Giới hạn bộ nhớ (KB)">
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
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Đề bài</h2>
          <Button
            onClick={() => setPreviewStatement((shown) => !shown)}
            size="sm"
            type="button"
            variant="outline"
          >
            {previewStatement ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
            {previewStatement ? "Soạn" : "Xem trước"}
          </Button>
        </div>

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
            onChange={(event) => patchContent({ statement: event.target.value })}
            placeholder="Markdown. Mô tả bài toán, đầu vào, đầu ra."
            value={value.content.statement ?? ""}
          />
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold">Ngôn ngữ hỗ trợ</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Mỗi ngôn ngữ đã chọn phải có lời giải mẫu thì mới gửi duyệt được.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {LANGUAGES.map((option) => (
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
            <p className="mb-1.5 text-xs text-muted-foreground">Mã khởi tạo cho học viên</p>
            <CodeEditor
              height={150}
              language={language.monaco ?? language.id}
              onChange={(code) => patchLanguage(language.id, { starterCode: code })}
              placeholder="// để trống nếu không cần"
              theme={theme}
              value={language.starterCode ?? ""}
            />
            <p className="mt-3 mb-1.5 text-xs text-muted-foreground">Lời giải mẫu</p>
            <CodeEditor
              height={180}
              language={language.monaco ?? language.id}
              onChange={(code) => patchLanguage(language.id, { referenceSolution: code })}
              theme={theme}
              value={language.referenceSolution ?? ""}
            />
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Test case</h2>
          <Button onClick={addTestCase} size="sm" type="button" variant="outline">
            <Plus className="size-3.5" />
            Thêm
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Tối thiểu 3 case, trong đó ít nhất một case công khai để học viên thấy ví dụ.
        </p>

        {testCases.length === 0 && (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Chưa có test case nào.
          </p>
        )}

        {testCases.map((testCase, index) => (
          <div className="mb-3 rounded-lg border p-4" key={index}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Case {testCase.order}</span>
              <div className="flex items-center gap-2">
                <Select
                  label={`Phạm vi case ${testCase.order}`}
                  onChange={(visibility) =>
                    patchTestCase(index, { visibility: visibility as TestCase["visibility"] })
                  }
                  options={[
                    { value: "public", label: "Công khai" },
                    { value: "hidden", label: "Ẩn" },
                  ]}
                  shape="box"
                  value={testCase.visibility}
                />
                <button
                  aria-label={`Xoá case ${testCase.order}`}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => removeTestCase(index)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Đầu vào
                <textarea
                  className={`${textareaClassName} mt-1.5 min-h-20 font-mono`}
                  onChange={(event) => patchTestCase(index, { input: event.target.value })}
                  value={testCase.input}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Đầu ra mong đợi
                <textarea
                  className={`${textareaClassName} mt-1.5 min-h-20 font-mono`}
                  onChange={(event) => patchTestCase(index, { expected: event.target.value })}
                  value={testCase.expected}
                />
              </label>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Cách chấm</h2>
        <Field htmlFor="checker" label="Bộ so khớp">
          <select
            className={inputClassName}
            id="checker"
            onChange={(event) =>
              patchContent({
                evaluation: {
                  ...value.content.evaluation,
                  checker: event.target.value as "exact" | "trimmed" | "float" | "custom",
                },
              })
            }
            value={value.content.evaluation?.checker ?? "trimmed"}
          >
            <option value="exact">So khớp tuyệt đối</option>
            <option value="trimmed">Bỏ khoảng trắng thừa</option>
            <option value="float">So sánh số thực</option>
            <option value="custom">Checker riêng</option>
          </select>
        </Field>
      </Card>
    </fieldset>
  );
}
