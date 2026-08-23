"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Braces,
  Code2,
  FileText,
  ListChecks,
  Loader2,
  Play,
  RotateCcw,
  SquareTerminal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel } from "react-resizable-panels";
import {
  Button,
  LanguageDropdown,
  Pane,
  ResizeHandle,
  StatusBadge,
  useWorkspace,
  WorkspaceProvider,
  type PanesState,
  type TabMetaMap,
} from "@codementor/ui";
import { CodeEditor, FORMATTABLE_LANGUAGES } from "@codementor/editor";
import {
  DIFFICULTY_LABELS,
  fileExtension,
  STATUS_LABELS,
  STATUS_TONES,
  VERDICT_LABELS,
  VERDICT_TONES,
  type Exercise,
  type ExerciseStatus,
  showValue,
  type JudgeRunPayload,
  type JudgeRunResult,
} from "./types";

/** Closed union so the content switch below stays exhaustive when a tab is added. */
type SolveTab = "description" | "code" | "testcase" | "result";

/**
 * `evaluation.checker` của đề → `judgeMode` của judge.
 *
 * Hai từ vựng không trùng nhau vì `checker` có sẵn từ thời stdin: `trimmed` và `custom` không
 * có nghĩa khi so sánh giá trị có kiểu, nên chúng về `exact`.
 */
function judgeModeOf(checker: string | undefined): "exact" | "float" | "unordered" {
  if (checker === "float" || checker === "unordered") return checker;
  return "exact";
}


const TAB_META: TabMetaMap = {
  description: { label: "Đề bài", icon: FileText },
  code: { label: "Code", icon: Code2, iconClassName: "text-primary" },
  testcase: { label: "Testcase", icon: ListChecks },
  result: { label: "Kết quả", icon: SquareTerminal },
};

const INITIAL_PANES: PanesState = {
  left: { tabs: ["description"], active: "description" },
  editor: { tabs: ["code"], active: "code" },
  console: { tabs: ["testcase", "result"], active: "testcase" },
};

export interface SolvePreviewProps {
  exercise: Exercise;
  theme: "light" | "dark";
  /**
   * Cách gọi judge. Tiêm vào chứ không gọi thẳng: giảng viên đi qua Kong bằng token
   * trong trình duyệt, còn admin đi qua BFF của mình — cùng một màn hình, hai đường mạng.
   */
  run: (payload: JudgeRunPayload) => Promise<JudgeRunResult>;
  /** Nút quay lại trên thanh trên cùng. Mỗi ứng dụng có một chỗ để quay về. */
  back: { href: string; label: string };
  /** Chỗ cho hành động riêng của từng ứng dụng: giảng viên mở studio, admin quyết định duyệt. */
  actions?: ReactNode;
}

/**
 * The exercise as a learner meets it: statement on the left, editor top right, cases
 * below — the same three-pane split as the web client's solve screen, built on the same
 * primitives.
 *
 * No mascot, no AI assistant, no discussion tab. Those run on sample data in apps/client;
 * bringing them here would show an author invented conversation about their own exercise.
 *
 * Dùng chung cho giảng viên (xem thử bài mình soạn) và admin (kiểm tra trước khi duyệt).
 * Một đề "chạy được" chỉ chứng minh được bằng cách chạy nó, nên hai bên phải là CÙNG một
 * màn hình: admin từ chối dựa trên thứ khác với thứ tác giả đã xem là từ chối oan.
 */
export function SolvePreview({ exercise, theme, run, back, actions }: SolvePreviewProps) {
  const [languageId, setLanguageId] = useState(() => exercise.content?.languages?.[0]?.id ?? "");
  const [code, setCode] = useState(() => exercise.content?.languages?.[0]?.starterCode ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<JudgeRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Monaco chỉ format được qua chính instance của nó; không có API nào khác.
  const editorRef = useRef<{ getAction: (id: string) => { run: () => void } | null } | null>(null);

  const languages = exercise.content?.languages ?? [];
  const language = languages.find((item) => item.id === languageId);
  const publicCases = useMemo(
    () => (exercise.content?.testCases ?? []).filter((item) => item.visibility === "public"),
    [exercise],
  );

  const allCases = exercise.content?.testCases ?? [];

  /** Đổi ngôn ngữ — và nạp lại mã khởi tạo của ngôn ngữ đó. Cũng là hành vi nút "khôi phục". */
  const selectLanguage = (id: string) => {
    setLanguageId(id);
    setCode(languages.find((item) => item.id === id)?.starterCode ?? "");
  };

  const signature = exercise.content?.signature;
  const isFunction = exercise.content?.ioMode === "function";

  const submit = async (openResult: () => void) => {
    setRunning(true);
    setError(null);
    setResult(null);
    // Chấm trên TOÀN BỘ case, kể cả case ẩn: người xem đang kiểm chính cái đề này, và một
    // đề chỉ đúng trên case công khai là đề chưa kiểm được.
    try {
      setResult(
        await run({
          language: languageId,
          sourceCode: code,
          timeLimitMs: exercise.timeLimitMs,
          memoryLimitKb: exercise.memoryLimitKb,
          // Không có `spec` = judge chấm theo stdin/stdout như trước.
          ...(isFunction && signature
            ? {
                spec: {
                  functionName: signature.functionName,
                  // Ngôn ngữ kiểu tĩnh cần cả chữ ký để sinh driver, không chỉ tên hàm.
                  parameters: signature.parameters ?? [],
                  returnType: signature.returnType,
                  judgeMode: judgeModeOf(exercise.content?.evaluation?.checker),
                },
              }
            : {}),
          testCases: allCases.map((testCase) => ({
            order: testCase.order,
            input: testCase.input ?? "",
            args: testCase.args,
            expected: testCase.expected ?? "",
            weight: testCase.weight ?? 1,
          })),
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không chấm được");
    } finally {
      setRunning(false);
      openResult();
    }
  };

  const renderTab = (tab: SolveTab) => {
    switch (tab) {
      case "description":
        return (
          <div className="h-full overflow-y-auto p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONES[exercise.status as ExerciseStatus]}>
                {STATUS_LABELS[exercise.status as ExerciseStatus]}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {DIFFICULTY_LABELS[exercise.difficulty]} · {exercise.timeLimitMs} ms ·{" "}
                {Math.round(exercise.memoryLimitKb / 1024)} MB
              </span>
            </div>
            <h1 className="mb-3 text-lg font-semibold">{exercise.title}</h1>
            <div className="prose prose-sm max-w-none text-sm">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {exercise.content?.statement || "_Bài này chưa có đề._"}
              </ReactMarkdown>
            </div>
          </div>
        );

      case "code":
        return (
          <div className="flex h-full flex-col">
            {/* Cùng bố cục với khu làm bài của học viên (apps/client): tên file bên trái, bộ
                chọn ngôn ngữ và hai nút công cụ bên phải. Giảng viên xem trước chính màn hình
                học viên sẽ thấy — hai bên khác nhau thì bản xem trước mất ý nghĩa. */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="truncate rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-semibold">
                {language ? `solution.${fileExtension(language.id)}` : "chưa chọn ngôn ngữ"}
              </span>
              {languages.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <LanguageDropdown
                    label={(id) => languages.find((item) => item.id === id)?.label ?? id}
                    language={languageId}
                    languages={languages.map((item) => item.id)}
                    onChange={selectLanguage}
                  />
                  <button
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => selectLanguage(languageId)}
                    title="Khôi phục mã khởi tạo"
                    type="button"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  {language && FORMATTABLE_LANGUAGES.has(language.monaco ?? language.id) && (
                    <button
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => editorRef.current?.getAction("editor.action.formatDocument")?.run()}
                      title="Định dạng code"
                      type="button"
                    >
                      <Braces className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1">
              {language ? (
                <CodeEditor
                  height="100%"
                  language={language.monaco ?? language.id}
                  onChange={setCode}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  theme={theme}
                  value={code}
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  Bài này chưa khai báo ngôn ngữ nào. Thêm ở studio để xem thử.
                </p>
              )}
            </div>
          </div>
        );

      case "testcase":
        return (
          <div className="h-full overflow-y-auto p-3">
            {publicCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có test case công khai nào — học viên sẽ không thấy ví dụ.
              </p>
            ) : (
              <ul className="grid gap-2">
                {publicCases.map((testCase) => (
                  <li className="rounded-md border p-2.5 font-mono text-xs" key={testCase.order}>
                    <p className="font-sans text-muted-foreground">
                      {isFunction ? "Tham số" : "Đầu vào"}
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {(isFunction
                        ? (signature?.parameters ?? [])
                            .map(
                              (parameter, position) =>
                                `${parameter.name} = ${showValue((testCase.args ?? [])[position])}`,
                            )
                            .join("\n")
                        : showValue(testCase.input)) || "(rỗng)"}
                    </pre>
                    <p className="mt-2 font-sans text-muted-foreground">
                      {isFunction ? "Trả về" : "Đầu ra"}
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {showValue(testCase.expected) || "(rỗng)"}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "result":
        return (
          <div className="h-full overflow-y-auto p-3">
            {running && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Đang chạy trong sandbox…
              </p>
            )}

            {error && (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            {!running && !error && !result && (
              <p className="text-sm text-muted-foreground">
                Bấm “Chấm bài” để chạy thử trên toàn bộ test case.
              </p>
            )}

            {result && !running && (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={VERDICT_TONES[result.verdict]}>
                    {VERDICT_LABELS[result.verdict]}
                  </StatusBadge>
                  <span className="text-sm">
                    {result.passedTests}/{result.totalTests} case · {result.score} điểm
                  </span>
                  <span className="text-xs text-muted-foreground">{result.runtimeMs} ms</span>
                </div>

                {result.compileOutput && (
                  <pre className="overflow-x-auto rounded-md border border-warning/40 bg-warning/10 p-3 font-mono text-xs whitespace-pre-wrap">
                    {result.compileOutput}
                  </pre>
                )}

                {/* Chỉ có ở chế độ hàm: ở đó stdout không còn là bài nộp, nên `print` quay về
                    đúng vai trò gỡ lỗi và phải được hiện ra chứ không bị nuốt. */}
                {result.consoleOutput && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Console</p>
                    <pre className="max-h-40 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
                      {result.consoleOutput}
                    </pre>
                  </div>
                )}

                {result.cases.map((caseResult) => (
                  <div className="rounded-md border p-2.5 text-xs" key={caseResult.order}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <StatusBadge tone={VERDICT_TONES[caseResult.verdict]}>
                        {VERDICT_LABELS[caseResult.verdict]}
                      </StatusBadge>
                      <span className="font-medium">Case {caseResult.order}</span>
                      <span className="ml-auto text-muted-foreground">
                        {caseResult.runtimeMs} ms
                      </span>
                    </div>
                    {caseResult.verdict !== "accepted" && (
                      <dl className="grid gap-1 font-mono">
                        <div className="flex gap-2">
                          <dt className="w-16 shrink-0 font-sans text-muted-foreground">Mong đợi</dt>
                          <dd className="min-w-0 break-words">{caseResult.expected || "(rỗng)"}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="w-16 shrink-0 font-sans text-muted-foreground">Nhận được</dt>
                          <dd className="min-w-0 break-words">{caseResult.actual || "(rỗng)"}</dd>
                        </div>
                        {caseResult.stderr && (
                          <div className="flex gap-2">
                            <dt className="w-16 shrink-0 font-sans text-muted-foreground">stderr</dt>
                            <dd className="min-w-0 break-words text-destructive">
                              {caseResult.stderr}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <WorkspaceProvider initialPanes={INITIAL_PANES} tabMeta={TAB_META}>
      <SolveBody
        actions={actions}
        back={back}
        disabled={running || !language}
        exercise={exercise}
        onSubmit={submit}
        renderTab={renderTab}
        running={running}
      />
    </WorkspaceProvider>
  );
}

/**
 * Phần thân, nằm TRONG WorkspaceProvider.
 *
 * Tách ra vì `useWorkspace` chỉ gọi được bên dưới provider, mà việc bật tab "Kết quả" sau khi
 * chấm xong lại cần đúng hook đó — provider và người dùng nó không thể là một component.
 */
function SolveBody({
  exercise,
  renderTab,
  onSubmit,
  running,
  disabled,
  back,
  actions,
}: {
  exercise: Exercise;
  renderTab: (tab: SolveTab) => ReactNode;
  onSubmit: (openResult: () => void) => void;
  running: boolean;
  disabled: boolean;
  back: { href: string; label: string };
  actions?: ReactNode;
}) {
  const { setActive, maximized } = useWorkspace();
  const openResult = () => setActive("console", "result");

  const leftPane = (
    <Pane<SolveTab> id="left" className="min-h-0">
      {renderTab}
    </Pane>
  );
  const editorPane = (
    <Pane<SolveTab> id="editor" className="min-h-0">
      {renderTab}
    </Pane>
  );
  const consolePane = (
    <Pane<SolveTab> id="console" className="min-h-0">
      {renderTab}
    </Pane>
  );
  const panesById = { left: leftPane, editor: editorPane, console: consolePane };

  return (
      <div className="flex h-full flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <Link
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            href={back.href}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{exercise.title}</span>
          <Button disabled={disabled} onClick={() => onSubmit(openResult)} size="sm" type="button">
            {running ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Play aria-hidden="true" className="size-3.5" />
            )}
            {running ? "Đang chấm…" : "Chấm bài"}
          </Button>
          {actions}
        </div>

        <div className="min-h-0 flex-1">
          {maximized ? (
            <div className="h-full">{panesById[maximized as keyof typeof panesById]}</div>
          ) : (
            <Group orientation="horizontal" className="h-full">
              <Panel id="left" defaultSize="42%" minSize="20%" className="min-h-0">
                {leftPane}
              </Panel>

              <ResizeHandle orientation="horizontal" />

              <Panel id="workbench" defaultSize="58%" minSize="30%" className="min-h-0">
                <Group orientation="vertical" className="h-full">
                  <Panel id="editor" defaultSize="62%" minSize="20%" className="min-h-0">
                    {editorPane}
                  </Panel>
                  <ResizeHandle orientation="vertical" />
                  <Panel id="console" defaultSize="38%" minSize="15%" className="min-h-0">
                    {consolePane}
                  </Panel>
                </Group>
              </Panel>
            </Group>
          )}
        </div>
      </div>
  );
}
