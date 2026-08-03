"use client";

import { useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel } from "react-resizable-panels";
import { ArrowLeft, Braces, Loader2, Play, RotateCcw, Send, Sparkles } from "lucide-react";
import { Pane } from "@/components/workspace/pane";
import { ResizeHandle } from "@/components/workspace/resize-handle";
import { ProblemPicker } from "@/components/workspace/problem-picker";
import { LanguageDropdown } from "@/components/workspace/language-dropdown";
import { useWorkspace, WorkspaceProvider } from "@/components/workspace/workspace-context";
import type { PanesState, TabKind } from "@/components/workspace/types";
import { type Problem } from "@/data/sample-problem";
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
  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState<Record<string, string>>(problem.starter);
  const editorRef = useRef<MonacoEditorHandle | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ input: string; expected: string; pass: boolean }[] | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    {
      from: "ai",
      text: "Chào bạn! Mình sẽ gợi ý theo hướng dẫn từng bước, không đưa đáp án hoàn chỉnh. Bạn đang vướng ở đâu?",
    },
  ]);

  const resetCode = () => setCode((c) => ({ ...c, [language]: problem.starter[language] ?? "" }));
  const formatCode = () => editorRef.current?.getAction("editor.action.formatDocument")?.run();

  const runCode = () => {
    setRunning(true);
    setTimeout(() => {
      setResults(problem.testCases.map((tc) => ({ input: tc.input, expected: tc.expected, pass: Math.random() > 0.3 })));
      setRunning(false);
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
            <div className="mb-3 flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span key={tag} className="rounded-sm bg-border-soft px-2 py-0.5 text-[11px] font-medium text-text">
                  {tag}
                </span>
              ))}
            </div>
            <article className="prose-sm max-w-none text-sm leading-relaxed text-text [&_code]:rounded-sm [&_code]:bg-border-soft [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-navy [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-100 [&_strong]:font-semibold [&_strong]:text-navy">
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
        return (
          <div className="p-4 text-sm text-text-faint">Chưa có bình luận nào cho bài này.</div>
        );
      case "code":
        return (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#1e1e1e] px-2 py-1">
              <LanguageDropdown language={language} onChange={setLanguage} languages={languages} />
              <div className="flex items-center gap-0.5">
                <button
                  onClick={resetCode}
                  title="Khôi phục code mẫu"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={formatCode}
                  title="Format code"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
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
                onChange={(v) => setCode((c) => ({ ...c, [language]: v ?? "" }))}
                theme="vs-dark"
                options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 12 } }}
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
      <WorkspaceBody problem={problem} backHref={backHref} runCode={runCode} running={running} renderTabContent={renderTabContent} />
    </WorkspaceProvider>
  );
}

function WorkspaceBody({
  problem,
  backHref,
  runCode,
  running,
  renderTabContent,
}: {
  problem: Problem;
  backHref: string;
  runCode: () => void;
  running: boolean;
  renderTabContent: (kind: TabKind) => ReactNode;
}) {
  const { panes, openTab, closeTab, maximized } = useWorkspace();
  const aiVisible = panes.ai.tabs.length > 0;
  const toggleAi = () => (aiVisible ? closeTab("ai", "ai") : openTab("ai", "ai"));

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
      <div className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-surface px-3">
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
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-bg disabled:opacity-50"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Chạy
          </button>
          <button className="rounded-md bg-navy px-3.5 py-1.5 text-xs font-semibold text-on-ink hover:bg-navy/90">
            Nộp bài
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

        <div />
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
    </div>
  );
}
