"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel } from "react-resizable-panels";
import { ArrowLeft, Bot, Braces, Loader2, PartyPopper, Play, RotateCcw, Send, Sparkles } from "lucide-react";
import { ProblemPicker } from "@/components/workspace/problem-picker";
import { UserMenu } from "@/components/user-menu";
import { TAB_META, type PaneId, type PanesState, type TabKind } from "@/components/workspace/types";
import { LanguageDropdown, Pane, ResizeHandle, useWorkspace, WorkspaceProvider } from "@codementor/ui";
import { type Problem } from "@/data/sample-problem";
import { useResolvedTheme } from "@/lib/store/use-resolved-theme";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { JUDGE_LANGUAGE_IDS, VERDICT_LABELS, type JudgeRunResult } from "@/types/judge";
import { DiscussionPanel } from "@/components/workspace/discussion-panel";
import { MascotAssistant, type MascotState } from "@/components/workspace/mascot-assistant";
import "highlight.js/styles/github-dark.css";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-text-muted">
      Đang tải trình soạn code...
    </div>
  ),
});

const languages = ["C", "C++", "Python", "Java", "JavaScript"];
const monacoLang: Record<string, string> = { C: "c", "C++": "cpp", Python: "python", Java: "java", JavaScript: "javascript" };
const fileExtension: Record<string, string> = { C: "c", "C++": "cpp", Python: "py", Java: "java", JavaScript: "js" };
const xpByDifficulty = { "Cơ bản": 25, "Trung bình": 50, "Nâng cao": 80 } as const;

const initialPanes: PanesState = {
  left: { tabs: ["description", "discussion"], active: "description" },
  editor: { tabs: ["code"], active: "code" },
  console: { tabs: ["testcase", "result"], active: "testcase" },
  ai: { tabs: [], active: null },
};

interface MonacoEditorHandle {
  getAction: (id: string) => { run: () => void } | null;
}

export interface LessonContext {
  courseId: string;
  lessonId: string;
  exerciseId: string;
}

export function SolveWorkspace({
  problem,
  backHref = "/practice",
  context,
}: {
  problem: Problem;
  backHref?: string;
  context?: LessonContext;
}) {
  const editorTheme = useResolvedTheme();
  const offered = problem.languages?.length
    ? problem.languages.map((entry) => entry.label).filter((label) => label in monacoLang)
    : languages;
  const available = offered.length > 0 ? offered : languages;
  const [language, setLanguage] = useState(available[0]);
  const [code, setCode] = useState<Record<string, string>>(problem.starter);
  const editorRef = useRef<MonacoEditorHandle | null>(null);
  const { status: authStatus } = useAuth();
  const [running, setRunning] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeRunResult | null>(null);
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [celebrating, setCelebrating] = useState(false);
  const [codeyVisible, setCodeyVisible] = useState(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    {
      from: "ai",
      text: "Chào bạn! Mình sẽ gợi ý theo hướng dẫn từng bước, không đưa đáp án hoàn chỉnh. Bạn đang vướng ở đâu?",
    },
  ]);

  const resetCode = () => setCode((c) => ({ ...c, [language]: problem.starter[language] ?? "" }));
  const formatCode = () => editorRef.current?.getAction("editor.action.formatDocument")?.run();

  const handleCodeChange = (value: string) => {
    setCode((current) => ({ ...current, [language]: value }));
    setMascotState("typing");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setMascotState("idle"), 900);
  };

  /**
   * Chạy thử và nộp bài đi cùng một đường chấm; khác nhau ở hai điểm.
   *
   * Nộp bài gửi kèm `context`, và đó là thứ quyết định bài học có được đánh dấu hoàn thành
   * hay không — chạy thử không được phép ghi tiến độ, nếu không thì bấm "Chạy" một lần là
   * xong bài. Nộp mà ĐẠT thì mở hộp chúc mừng; sai thì không, vì lúc đó thứ người học cần
   * là bảng test case sai, không phải một hộp thoại chắn đường.
   */
  const execute = async (mode: "run" | "submit") => {
    if (authStatus !== "authenticated") {
      setJudgeError("Cần đăng nhập để chấm bài.");
      return;
    }

    setRunning(true);
    setMascotState("loading");
    setJudgeError(null);
    setJudgeResult(null);
    setCelebrating(false);

    try {
      const result = await api.judge.run({
        language: JUDGE_LANGUAGE_IDS[language] ?? language.toLowerCase(),
        sourceCode: code[language] ?? "",
        timeLimitMs: 1000,
        memoryLimitKb: 128 * 1024,
        // `spec` present = grade by calling the function; absent = pipe stdin. Sending one
        // for a stdin exercise would make the judge look for a function that is not there.
        ...(problem.spec ? { spec: problem.spec } : {}),
        testCases: problem.testCases.map((testCase, index) => ({
          order: index + 1,
          ...(testCase.args !== undefined ? { args: testCase.args } : { input: testCase.input ?? "" }),
          expected: testCase.expected,
        })),
        ...(mode === "submit" && context ? { context } : {}),
      });
      setJudgeResult(result);
      setMascotState(result.verdict === "accepted" ? "success" : "error");
      if (mode === "submit" && result.verdict === "accepted") setCelebrating(true);
    } catch (cause) {
      setJudgeError(cause instanceof Error ? cause.message : "Không chấm được");
      setMascotState("error");
    } finally {
      setRunning(false);
    }
  };

  const sendAiMessage = () => {
    const text = aiInput.trim();
    if (!text) return;
    setAiMessages((m) => [...m, { from: "user", text }]);
    setAiInput("");
    setTimeout(() => {
      setAiMessages((m) => [
        ...m,
        { from: "ai", text: "Thử xét lại điều kiện dừng của bài toán này — bạn đã xử lý hết các trường hợp biên chưa?" },
      ]);
    }, 600);
  };

  function renderTabContent(kind: TabKind) {
    switch (kind) {
      case "description":
        return (
          <div className="h-full overflow-y-auto p-4">
            <div className="mb-4 border-b border-border-soft pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 text-2xs font-semibold tracking-wide text-text-faint uppercase">Bài luyện tập</div>
                  <h1 className="text-xl font-bold text-navy">{problem.title}</h1>
                </div>
                <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-bold text-primary">+{xpByDifficulty[problem.difficulty]} XP</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">Độ khó: <b className="text-navy">{problem.difficulty}</b> · Giới hạn 1 giây · 128 MB</p>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span key={tag} className="rounded-sm bg-border-soft px-2 py-0.5 text-2xs font-medium text-text">
                  {tag}
                </span>
              ))}
            </div>
            <article className="prose-sm max-w-none text-sm leading-relaxed text-text [&_code]:rounded-sm [&_code]:bg-border-soft [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink-fixed [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:text-on-ink-fixed [&_strong]:font-semibold [&_strong]:text-navy">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{problem.description}</ReactMarkdown>
            </article>
            <div className="mt-4 text-xs font-bold tracking-wide text-text-faint uppercase">Ràng buộc</div>
            <ul className="mt-2 list-disc pl-4 text-xs leading-relaxed text-text-muted">
              {problem.constraints.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        );
      case "discussion":
        return <DiscussionPanel problemTitle={problem.title} />;
      case "code":
        return (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-bg px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs font-semibold text-navy">solution.{fileExtension[language]}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <LanguageDropdown language={language} onChange={setLanguage} languages={available} />
                <button
                  onClick={resetCode}
                  title="Khôi phục code mẫu"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={formatCode}
                  title="Format code"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
                >
                  <Braces className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <Editor
                key={language}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                language={monacoLang[language]}
                value={code[language] ?? ""}
                onChange={(v) => handleCodeChange(v ?? "")}
                theme={editorTheme === "dark" ? "vs-dark" : "vs"}
                options={{ fontSize: 13, lineHeight: 21, minimap: { enabled: true, scale: 0.7, showSlider: "mouseover" }, automaticLayout: true, padding: { top: 14 }, fontLigatures: true, smoothScrolling: true, cursorBlinking: "smooth", renderLineHighlight: "all", bracketPairColorization: { enabled: true } }}
              />
            </div>
          </div>
        );
      case "testcase":
        return (
          <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
            {(problem.publicTestCases ?? problem.testCases).map((tc, i) => (
              <div key={i} className="rounded-md border border-border-soft bg-bg p-2.5 font-mono text-xs">
                <div className="mb-1 font-sans text-2xs font-semibold text-text-faint uppercase">
                  {tc.args !== undefined ? "Tham số" : "Input"}
                </div>
                <div className="text-navy">
                  {tc.args !== undefined
                    ? tc.args.map((arg) => JSON.stringify(arg)).join(", ")
                    : tc.input}
                </div>
                {tc.expected !== undefined && tc.expected !== "" && (
                  <>
                    <div className="mt-1.5 mb-1 font-sans text-2xs font-semibold text-text-faint uppercase">
                      Kết quả mong đợi
                    </div>
                    <div className="text-navy">{JSON.stringify(tc.expected)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      case "result":
        return (
          <div className="h-full overflow-y-auto p-3">
            {running ? (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang chạy trong sandbox...
              </div>
            ) : judgeError ? (
              <div className="flex flex-col items-start gap-2 rounded-md bg-danger-tint p-3 text-xs text-danger">
                <span>{judgeError}</span>
                {authStatus !== "authenticated" && (
                  // Về /login, không đẩy thẳng sang Keycloak: form email/mật khẩu giờ
                  // nằm ngay trên trang của CodeMentor.
                  <Link href="/login" className="font-semibold underline underline-offset-2">
                    Đăng nhập
                  </Link>
                )}
              </div>
            ) : judgeResult ? (
              <div className="flex flex-col gap-2">
                <div
                  className={`mb-1 flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold ${
                    judgeResult.verdict === "accepted"
                      ? "bg-success-tint text-success"
                      : "bg-danger-tint text-danger"
                  }`}
                >
                  <span>{VERDICT_LABELS[judgeResult.verdict]}</span>
                  <span>
                    {judgeResult.passedTests}/{judgeResult.totalTests} · {judgeResult.runtimeMs} ms
                  </span>
                </div>

                {judgeResult.compileOutput && (
                  <pre className="overflow-x-auto rounded-md bg-danger-tint p-2.5 font-mono text-xs whitespace-pre-wrap text-danger">
                    {judgeResult.compileOutput}
                  </pre>
                )}

                {judgeResult.cases.map((caseResult) => {
                  const passed = caseResult.verdict === "accepted";
                  return (
                    <div
                      key={caseResult.order}
                      className={`rounded-md p-2.5 font-mono text-xs ${passed ? "bg-success-tint" : "bg-danger-tint"}`}
                    >
                      <div
                        className={`mb-1 flex justify-between font-sans font-semibold ${passed ? "text-success" : "text-danger"}`}
                      >
                        <span>
                          {passed ? "✓ Đạt" : "✗ Không đạt"} — Test {caseResult.order}
                        </span>
                        <span className="font-normal text-text-faint">{caseResult.runtimeMs} ms</span>
                      </div>
                      {!passed && (
                        <>
                          <div className="text-text-faint">expected: {caseResult.expected}</div>
                          <div className="text-text-faint">actual: {caseResult.actual || "(rỗng)"}</div>
                          {caseResult.stderr && (
                            <div className="mt-1 break-words text-danger">{caseResult.stderr}</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-text-faint">Nhấn &ldquo;Chạy&rdquo; để biên dịch và xem kết quả.</div>
            )}
          </div>
        );
      case "ai":
        return (
          <div className="flex h-full flex-col">
            <div className="border-b border-border-soft bg-ai-tint/60 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ai"><Sparkles className="h-3.5 w-3.5" /> Trợ lý AI chuyên sâu</div>
              <p className="mt-1 text-2xs leading-4 text-text-muted">Phân tích toàn bộ hướng giải, độ phức tạp và code hiện tại. Hoạt động độc lập với chat nhanh Codey.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {aiMessages.map((m, i) => (
                <div key={i} className={`mb-2.5 flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-md px-3 py-2 text-xs leading-relaxed ${
                      m.from === "user" ? "bg-navy text-on-ink" : "bg-ai-tint text-navy"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 gap-2 border-t border-border-soft p-2.5">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                placeholder="Hỏi trợ lý AI..."
                className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs"
              />
              <button onClick={sendAiMessage} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ai text-on-ink">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
    }
  }

  return (
    <WorkspaceProvider initialPanes={initialPanes} tabMeta={TAB_META}>
      <WorkspaceBody problem={problem} backHref={backHref} execute={execute} running={running} mascotState={mascotState} codeyVisible={codeyVisible} onToggleCodey={() => setCodeyVisible((v) => !v)} renderTabContent={renderTabContent} />
      {celebrating && judgeResult && (
        <SolvedDialog
          result={judgeResult}
          xp={xpByDifficulty[problem.difficulty]}
          backHref={backHref}
          tracked={Boolean(context)}
          onClose={() => setCelebrating(false)}
        />
      )}
    </WorkspaceProvider>
  );
}

function WorkspaceBody({
  problem,
  backHref,
  execute,
  running,
  mascotState,
  codeyVisible,
  onToggleCodey,
  renderTabContent,
}: {
  problem: Problem;
  backHref: string;
  execute: (mode: "run" | "submit") => void;
  running: boolean;
  mascotState: MascotState;
  codeyVisible: boolean;
  onToggleCodey: () => void;
  renderTabContent: (kind: TabKind) => ReactNode;
}) {
  const { panes, setActive, openTab, closeTab, maximized } = useWorkspace();
  const aiVisible = panes.ai.tabs.length > 0;
  const toggleAi = () => (aiVisible ? closeTab("ai", "ai") : openTab("ai", "ai"));

  /**
   * Chuyển sang tab Kết quả TRƯỚC khi chấm, không phải sau.
   *
   * Bấm Chạy mà màn hình không đổi gì ngoài cái spinner trong nút thì người dùng không biết
   * có chuyện gì đang xảy ra — kết quả nằm ở một tab họ không nhìn. Chuyển trước để họ thấy
   * ngay dòng "Đang chạy trong sandbox...".
   *
   * Tìm pane nào đang GIỮ tab đó thay vì mặc định `console`: tab kéo thả được, và
   * `openTab` sẽ lôi nó về chỗ cũ, giật mất bố cục người dùng tự sắp.
   */
  const focusResult = (mode: "run" | "submit") => {
    const holder = Object.keys(panes).find((pane) => panes[pane].tabs.includes("result"));
    if (holder) setActive(holder, "result");
    else openTab("console", "result");
    execute(mode);
  };

  const leftPane = (
    <Pane<TabKind> id="left" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const editorPane = (
    <Pane<TabKind> id="editor" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const consolePane = (
    <Pane<TabKind> id="console" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const aiPane = (
    <Pane<TabKind> id="ai" className="min-h-0">
      {renderTabContent}
    </Pane>
  );

  const panesById = { left: leftPane, editor: editorPane, console: consolePane, ai: aiPane };

  return (
    <div className="flex h-full flex-col">
      <div className="grid min-h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-surface px-3">
        <div className="flex min-w-0 items-center gap-1">
          <Link
            href={backHref}
            title="Danh sách bài luyện tập"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <ProblemPicker current={problem} />
        </div>

        <div className="flex items-center gap-2 justify-self-center">
          <button
            onClick={() => focusResult("run")}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-bg disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Chạy
          </button>
          <button
            onClick={() => focusResult("submit")}
            disabled={running}
            className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-on-ink hover:bg-primary-hover disabled:opacity-50"
          >
            Nộp bài · +{xpByDifficulty[problem.difficulty]} XP
          </button>
          <button
            onClick={onToggleCodey}
            title={codeyVisible ? "Ẩn Codey" : "Hiện Codey"}
            aria-label={codeyVisible ? "Ẩn Codey" : "Hiện Codey"}
            aria-pressed={codeyVisible}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              codeyVisible ? "bg-primary-tint text-primary" : "text-text-muted hover:bg-bg hover:text-navy"
            }`}
          >
            <Bot className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={toggleAi}
            title="Trợ lý AI"
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              aiVisible ? "bg-ai-tint text-ai" : "text-text-muted hover:bg-bg hover:text-navy"
            }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-1">
          <UserMenu collapsed placement="down" />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {maximized ? (
          <div className="h-full">{panesById[maximized as PaneId]}</div>
        ) : (
          <Group key={aiVisible ? "3col" : "2col"} orientation="horizontal" className="h-full">
            <Panel id="left" defaultSize={aiVisible ? "33%" : "50%"} minSize="18%" className="min-h-0">
              {leftPane}
            </Panel>

            <ResizeHandle orientation="horizontal" />

            <Panel id="workbench" defaultSize={aiVisible ? "34%" : "50%"} minSize="25%" className="min-h-0">
              <Group orientation="vertical" className="h-full">
                <Panel id="editor" defaultSize="60%" minSize="20%" className="min-h-0">
                  {editorPane}
                </Panel>
                <ResizeHandle orientation="vertical" />
                <Panel id="console" defaultSize="40%" minSize="15%" className="min-h-0">
                  {consolePane}
                </Panel>
              </Group>
            </Panel>

            {aiVisible && (
              <>
                <ResizeHandle orientation="horizontal" />
                <Panel id="ai" defaultSize="33%" minSize="18%" maxSize="45%" className="min-h-0">
                  {aiPane}
                </Panel>
              </>
            )}
          </Group>
        )}
      </div>
      {codeyVisible && <MascotAssistant state={mascotState} />}
    </div>
  );
}

/**
 * Xác nhận khi nộp đạt.
 *
 * Trước đây nộp bài và chạy thử cho ra cùng một thứ: một bảng kết quả ở tab người dùng
 * không nhìn. Không có gì đánh dấu rằng lần bấm này khác — rằng bài đã xong.
 *
 * Là dialog thật (`role="dialog"`, `aria-modal`), đóng được bằng Esc, và tự lấy tiêu điểm
 * để bàn phím không rơi lại vào trình soạn code phía sau. Hiệu ứng phóng vào bị tắt khi hệ
 * điều hành báo `prefers-reduced-motion` — với một số người nó gây chóng mặt thật.
 */
function SolvedDialog({
  result,
  xp,
  backHref,
  tracked,
  onClose,
}: {
  result: JudgeRunResult;
  xp: number;
  backHref: string;
  /** Bài mở từ trong khóa học: tiến độ sẽ được ghi. Luyện tập tự do thì không. */
  tracked: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="solved-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-fixed/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center shadow-lg motion-safe:animate-[solved-pop_220ms_ease-out]"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-tint text-success motion-safe:animate-[solved-pop_320ms_ease-out]">
          <PartyPopper className="h-7 w-7" />
        </div>

        <h2 id="solved-title" className="mt-4 text-lg font-bold text-navy">
          Chính xác!
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          {result.passedTests}/{result.totalTests} test case đạt · {result.runtimeMs} ms · +{xp} XP
        </p>

        <p className="mt-3 text-2xs leading-relaxed text-text-faint">
          {tracked
            ? "Bài học đã được ghi nhận hoàn thành. Quay lại khóa học và tải lại trang để thấy tiến độ cập nhật."
            : "Đây là bài luyện tập tự do nên không gắn với tiến độ khóa học nào."}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-navy hover:bg-bg"
          >
            Ở lại xem code
          </button>
          <Link
            href={backHref}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-on-ink hover:bg-primary-hover"
          >
            {tracked ? "Quay lại bài học" : "Quay lại danh sách"}
          </Link>
        </div>
      </div>
    </div>
  );
}
