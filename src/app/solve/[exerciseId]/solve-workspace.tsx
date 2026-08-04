"use client";

import { useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel } from "react-resizable-panels";
import { ArrowLeft, Braces, Loader2, MessageSquareText, Play, RotateCcw, Send, Sparkles } from "lucide-react";
import { Pane } from "@/components/workspace/pane";
import { ResizeHandle } from "@/components/workspace/resize-handle";
import { ProblemPicker } from "@/components/workspace/problem-picker";
import { UserMenu } from "@/components/user-menu";
import { LanguageDropdown } from "@/components/workspace/language-dropdown";
import { useWorkspace, WorkspaceProvider } from "@/components/workspace/workspace-context";
import type { PanesState, TabKind } from "@/components/workspace/types";
import { type Problem } from "@/data/sample-problem";
import { useResolvedTheme } from "@/lib/store/use-resolved-theme";
import { DiscussionPanel } from "@/components/workspace/discussion-panel";
import { MascotAssistant, type MascotState } from "@/components/workspace/mascot-assistant";
import "highlight.js/styles/github-dark.css";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
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

export function SolveWorkspace({ problem, backHref = "/practice" }: { problem: Problem; backHref?: string }) {
  const editorTheme = useResolvedTheme();
  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState<Record<string, string>>(problem.starter);
  const editorRef = useRef<MonacoEditorHandle | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ input: string; expected: string; pass: boolean }[] | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
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

  const runCode = () => {
    setRunning(true);
    setMascotState("loading");
    setTimeout(() => {
      const hasMeaningfulChange = (code[language] ?? "").trim() !== (problem.starter[language] ?? "").trim();
      const nextResults = problem.testCases.map((tc, index) => ({ input: tc.input, expected: tc.expected, pass: hasMeaningfulChange || index !== problem.testCases.length - 1 }));
      setResults(nextResults);
      setRunning(false);
      setMascotState(nextResults.every((result) => result.pass) ? "success" : "error");
    }, 700);
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
                  <div className="mb-1 text-[11px] font-semibold tracking-wide text-text-faint uppercase">Bài luyện tập</div>
                  <h1 className="text-xl font-bold text-navy">{problem.title}</h1>
                </div>
                <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-bold text-primary">+{xpByDifficulty[problem.difficulty]} XP</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">Độ khó: <b className="text-navy">{problem.difficulty}</b> · Giới hạn 1 giây · 128 MB</p>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span key={tag} className="rounded-sm bg-border-soft px-2 py-0.5 text-[11px] font-medium text-text">
                  {tag}
                </span>
              ))}
            </div>
            <article className="prose-sm max-w-none text-sm leading-relaxed text-text [&_code]:rounded-sm [&_code]:bg-border-soft [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-ink-fixed [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-100 [&_strong]:font-semibold [&_strong]:text-navy">
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
                <LanguageDropdown language={language} onChange={setLanguage} languages={languages} />
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
            {problem.testCases.map((tc, i) => (
              <div key={i} className="rounded-md border border-border-soft bg-bg p-2.5 font-mono text-xs">
                <div className="mb-1 font-sans text-[11px] font-semibold text-text-faint uppercase">Input</div>
                <div className="text-navy">{tc.input}</div>
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
            ) : results ? (
              <div className="flex flex-col gap-2">
                <div className={`mb-1 flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold ${results.every((result) => result.pass) ? "bg-success-tint text-success" : "bg-danger-tint text-danger"}`}>
                  <span>{results.every((result) => result.pass) ? "Tất cả test case đã đạt" : "Có test case cần xem lại"}</span>
                  <span>{results.filter((result) => result.pass).length}/{results.length}</span>
                </div>
                {results.map((r, i) => (
                  <div key={i} className={`rounded-md p-2.5 font-mono text-xs ${r.pass ? "bg-success-tint" : "bg-danger-tint"}`}>
                    <div className={`mb-1 font-sans font-semibold ${r.pass ? "text-success" : "text-danger"}`}>
                      {r.pass ? "✓ Đạt" : "✗ Không đạt"} — Test {i + 1}
                    </div>
                    <div className="text-text-faint">input: {r.input}</div>
                    <div className="text-text-faint">expected: {r.expected}</div>
                  </div>
                ))}
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
              <p className="mt-1 text-[10px] leading-4 text-text-muted">Phân tích toàn bộ hướng giải, độ phức tạp và code hiện tại. Hoạt động độc lập với chat nhanh Codey.</p>
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
                className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs outline-none"
              />
              <button onClick={sendAiMessage} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ai text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
    }
  }

  return (
    <WorkspaceProvider initialPanes={initialPanes}>
      <WorkspaceBody problem={problem} backHref={backHref} runCode={runCode} running={running} mascotState={mascotState} renderTabContent={renderTabContent} />
    </WorkspaceProvider>
  );
}

function WorkspaceBody({
  problem,
  backHref,
  runCode,
  running,
  mascotState,
  renderTabContent,
}: {
  problem: Problem;
  backHref: string;
  runCode: () => void;
  running: boolean;
  mascotState: MascotState;
  renderTabContent: (kind: TabKind) => ReactNode;
}) {
  const { panes, openTab, closeTab, maximized } = useWorkspace();
  const aiVisible = panes.ai.tabs.length > 0;
  const toggleAi = () => (aiVisible ? closeTab("ai", "ai") : openTab("ai", "ai"));
  const openDiscussion = () => openTab("left", "discussion");

  const leftPane = (
    <Pane id="left" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const editorPane = (
    <Pane id="editor" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const consolePane = (
    <Pane id="console" className="min-h-0">
      {renderTabContent}
    </Pane>
  );
  const aiPane = (
    <Pane id="ai" className="min-h-0">
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
          <span className="hidden rounded-full bg-border-soft px-2 py-1 text-[10px] font-semibold text-text-muted lg:inline">{problem.difficulty}</span>
        </div>

        <div className="flex items-center gap-2 justify-self-center">
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-bg disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Chạy
          </button>
          <button onClick={runCode} disabled={running} className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
            Nộp bài · +{xpByDifficulty[problem.difficulty]} XP
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
          <button type="button" onClick={openDiscussion} title="Mở thảo luận" className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy">
            <MessageSquareText className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 rounded-full bg-primary px-1 text-[8px] font-bold text-white">4</span>
          </button>
          <UserMenu collapsed placement="down" />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {maximized ? (
          <div className="h-full">{panesById[maximized]}</div>
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
      <MascotAssistant state={mascotState} />
    </div>
  );
}
