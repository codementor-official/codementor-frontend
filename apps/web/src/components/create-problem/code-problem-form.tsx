"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Eye, Pencil, Play, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CodeEditor } from "./code-editor";
import type {
  CodeProblemDraft,
  ProblemExample,
  ProblemLanguage,
  ProblemTestCase,
} from "@/types/problem-draft";

const LANGUAGES: ProblemLanguage[] = [
  { id: "c", label: "C", monaco: "c" },
  { id: "cpp", label: "C++", monaco: "cpp" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "go", label: "Go", monaco: "go" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" },
];

const EMPTY_DRAFT: CodeProblemDraft = {
  title: "",
  difficulty: "easy",
  tags: [],
  statement: "",
  examples: [{ id: "ex-1", input: "", output: "" }],
  constraints: [""],
  languageIds: ["c"],
  starter: {},
  solution: {},
  testCases: [{ id: "tc-1", input: "", expected: "", visibility: "public", generated: false }],
};

let nextId = 0;
const makeId = (prefix: string) => `${prefix}-${(nextId += 1)}`;

/** Section heading + optional right-hand action, repeated for every block of the form. */
function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">{title}</h2>
        {action}
      </div>
      {hint && <p className="mb-3 text-xs leading-relaxed text-text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </Card>
  );
}

/** The ✕ that removes one row of a repeatable list. */
function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-bg hover:text-navy"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

const fieldClasses =
  "w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-navy outline-none placeholder:text-text-faint focus:border-navy";

export function CodeProblemForm() {
  const [draft, setDraft] = useState<CodeProblemDraft>(EMPTY_DRAFT);
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("c");
  const [notice, setNotice] = useState("");

  const patch = (values: Partial<CodeProblemDraft>) => setDraft((d) => ({ ...d, ...values }));

  const selected = LANGUAGES.filter((l) => draft.languageIds.includes(l.id));
  // The per-language editor tabs follow the checkboxes, so unchecking the active one
  // has to hand focus back to a language that still exists.
  const editing = selected.find((l) => l.id === activeLanguage) ?? selected[0];

  const toggleLanguage = (id: string) =>
    patch({
      languageIds: draft.languageIds.includes(id)
        ? draft.languageIds.filter((l) => l !== id)
        : [...draft.languageIds, id],
    });

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || draft.tags.includes(tag)) return;
    patch({ tags: [...draft.tags, tag] });
    setTagInput("");
  };

  const updateExample = (id: string, values: Partial<ProblemExample>) =>
    patch({ examples: draft.examples.map((e) => (e.id === id ? { ...e, ...values } : e)) });

  const updateTestCase = (id: string, values: Partial<ProblemTestCase>) =>
    patch({ testCases: draft.testCases.map((t) => (t.id === id ? { ...t, ...values } : t)) });

  /** Stands in for the judge: the real thing compiles the reference solution and captures
   * stdout. Until that exists, mark the row generated so the UI flow is honest about which
   * outputs came from a run. */
  const runSolution = (id: string) => {
    if (!editing || !draft.solution[editing.id]?.trim()) {
      setNotice(`Chưa có đáp án tham khảo cho ${editing?.label ?? "ngôn ngữ này"} để chạy sinh output.`);
      return;
    }
    updateTestCase(id, { expected: "(output do hệ thống sinh)", generated: true });
    setNotice("");
  };

  const runAll = () => draft.testCases.forEach((t) => runSolution(t.id));

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-64 flex-1 text-sm font-semibold text-navy">
            Tiêu đề bài tập
            <Input
              className="mt-1.5"
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Ví dụ: Kiểm tra số nguyên tố"
            />
          </label>
          <div className="text-sm font-semibold text-navy">
            Độ khó
            <div className="mt-1.5">
              <Select
                label="Độ khó"
                className="h-10.5 rounded-md py-0 pl-3.5 text-sm"
                value={draft.difficulty}
                onChange={(v) => patch({ difficulty: v as CodeProblemDraft["difficulty"] })}
                options={DIFFICULTIES}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm font-semibold text-navy">
          Thẻ chủ đề
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {draft.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-navy"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => patch({ tags: draft.tags.filter((t) => t !== tag) })}
                  aria-label={`Bỏ thẻ ${tag}`}
                  className="text-text-faint hover:text-navy"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Thêm thẻ rồi nhấn Enter..."
              className="h-8 min-w-44 flex-1 rounded-md border border-border bg-surface px-2.5 text-xs text-navy outline-none placeholder:text-text-faint focus:border-navy"
            />
          </div>
        </div>
      </Card>

      <Section
        title="Đề bài"
        hint="Hỗ trợ Markdown — dùng ``` để chèn khối code, ** ** để in đậm."
        action={
          <Button size="sm" variant="outline" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Soạn thảo" : "Xem trước"}
          </Button>
        }
      >
        {showPreview ? (
          <div className="prose-sm min-h-40 rounded-md border border-border bg-bg p-4 text-sm leading-relaxed text-text">
            {draft.statement.trim() ? (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{draft.statement}</ReactMarkdown>
            ) : (
              <span className="text-text-faint">Chưa có nội dung để xem trước.</span>
            )}
          </div>
        ) : (
          <CodeEditor
            language="markdown"
            value={draft.statement}
            onChange={(statement) => patch({ statement })}
            placeholder="Cho một số nguyên dương n. Hãy kiểm tra..."
            height={200}
          />
        )}
      </Section>

      <Section
        title="Ví dụ"
        hint="Hiển thị cho người học ngay dưới đề bài — nên có ít nhất một ví dụ đúng và một ví dụ biên."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patch({ examples: [...draft.examples, { id: makeId("ex"), input: "", output: "" }] })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Thêm ví dụ
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {draft.examples.map((example) => (
            <div key={example.id} className="flex items-center gap-2">
              <input
                value={example.input}
                onChange={(e) => updateExample(example.id, { input: e.target.value })}
                placeholder="Input"
                className={`${fieldClasses} h-9 flex-1`}
              />
              <input
                value={example.output}
                onChange={(e) => updateExample(example.id, { output: e.target.value })}
                placeholder="Output"
                className={`${fieldClasses} h-9 flex-1`}
              />
              <RemoveButton
                label="Xóa ví dụ"
                onClick={() =>
                  patch({ examples: draft.examples.filter((e) => e.id !== example.id) })
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Ràng buộc"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => patch({ constraints: [...draft.constraints, ""] })}
          >
            <Plus className="h-3.5 w-3.5" /> Thêm ràng buộc
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {draft.constraints.map((constraint, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={constraint}
                onChange={(e) =>
                  patch({
                    constraints: draft.constraints.map((c, i) => (i === index ? e.target.value : c)),
                  })
                }
                placeholder="Ví dụ: 1 ≤ n ≤ 10^9"
                className={`${fieldClasses} h-9 flex-1`}
              />
              <RemoveButton
                label="Xóa ràng buộc"
                onClick={() =>
                  patch({ constraints: draft.constraints.filter((_, i) => i !== index) })
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Ngôn ngữ cho phép & code mẫu"
        hint="Code mẫu là phần người học thấy khi mở bài. Đáp án tham khảo chỉ dùng để sinh output cho test case."
      >
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {LANGUAGES.map((language) => (
            <label key={language.id} className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={draft.languageIds.includes(language.id)}
                onChange={() => toggleLanguage(language.id)}
                className="h-4 w-4 accent-primary"
              />
              {language.label}
            </label>
          ))}
        </div>

        {editing ? (
          <div className="mt-4">
            <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border">
              {selected.map((language) => (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => setActiveLanguage(language.id)}
                  className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    language.id === editing.id
                      ? "border-primary text-navy"
                      : "border-transparent text-text-muted hover:text-navy"
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <p className="mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
                  Code mẫu (starter)
                </p>
                <CodeEditor
                  language={editing.monaco}
                  value={draft.starter[editing.id] ?? ""}
                  onChange={(code) => patch({ starter: { ...draft.starter, [editing.id]: code } })}
                  placeholder="Khung code người học bắt đầu từ..."
                />
              </div>
              <div>
                <p className="mb-1.5 text-2xs font-bold tracking-wide text-text-faint uppercase">
                  Đáp án tham khảo (dùng để chạy sinh output)
                </p>
                <CodeEditor
                  language={editing.monaco}
                  value={draft.solution[editing.id] ?? ""}
                  onChange={(code) => patch({ solution: { ...draft.solution, [editing.id]: code } })}
                  placeholder="Code đáp án đúng cho ngôn ngữ này..."
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-dashed border-border p-4 text-center text-xs text-text-faint">
            Chọn ít nhất một ngôn ngữ để soạn code mẫu.
          </p>
        )}
      </Section>

      <Section
        title="Test case"
        hint='Nhập Input rồi bấm "Chạy đáp án" — hệ thống chạy đáp án tham khảo và tự điền Output.'
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                patch({
                  testCases: [
                    ...draft.testCases,
                    {
                      id: makeId("tc"),
                      input: "",
                      expected: "",
                      visibility: "public",
                      generated: false,
                    },
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Thêm test case
            </Button>
            {/* Outline, not primary: "Đăng bài tập" is this screen's one orange CTA. */}
            <Button size="sm" variant="outline" onClick={runAll}>
              <Play className="h-3.5 w-3.5" /> Chạy tất cả
            </Button>
          </div>
        }
      >
        {notice && (
          <p className="mb-3 rounded-md border border-border bg-bg px-3 py-2 text-xs text-navy">
            {notice}
          </p>
        )}
        <div className="flex flex-col gap-3">
          {draft.testCases.map((testCase, index) => (
            <div key={testCase.id} className="rounded-md border border-border bg-bg p-3">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-navy">Test {index + 1}</span>
                <div className="flex items-center gap-2">
                  <Select
                    label="Hiển thị"
                    shape="box"
                    value={testCase.visibility}
                    onChange={(v) =>
                      updateTestCase(testCase.id, {
                        visibility: v as ProblemTestCase["visibility"],
                      })
                    }
                    options={[
                      { value: "public", label: "Công khai" },
                      { value: "hidden", label: "Ẩn" },
                    ]}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runSolution(testCase.id)}
                    className="whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5" /> Chạy đáp án
                  </Button>
                  <RemoveButton
                    label={`Xóa test ${index + 1}`}
                    onClick={() =>
                      patch({ testCases: draft.testCases.filter((t) => t.id !== testCase.id) })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <label className="text-2xs font-bold tracking-wide text-text-faint uppercase">
                  Input
                  <textarea
                    value={testCase.input}
                    onChange={(e) => updateTestCase(testCase.id, { input: e.target.value })}
                    rows={3}
                    className={`${fieldClasses} mt-1 resize-y`}
                  />
                </label>
                <label className="text-2xs font-bold tracking-wide text-text-faint uppercase">
                  Expected output
                  <textarea
                    value={testCase.expected}
                    onChange={(e) =>
                      updateTestCase(testCase.id, { expected: e.target.value, generated: false })
                    }
                    rows={3}
                    placeholder="Để trống rồi bấm Chạy đáp án để tự điền"
                    className={`${fieldClasses} mt-1 resize-y`}
                  />
                  {testCase.generated && (
                    <span className="mt-1 block font-sans text-2xs normal-case text-text-faint">
                      Sinh từ đáp án tham khảo
                    </span>
                  )}
                </label>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Lưu nháp</Button>
        <Button>
          <Save className="h-4 w-4" /> Đăng bài tập
        </Button>
      </div>
    </div>
  );
}
