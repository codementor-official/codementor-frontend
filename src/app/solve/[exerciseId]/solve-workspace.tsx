"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { DifficultyBadge } from "@/components/ui/badge";
import { problems, type Problem } from "@/data/sample-problem";
import "highlight.js/styles/github-dark.css";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
      Đang tải trình soạn code...
    </div>
  ),
});

const languages = ["C", "C++", "Python", "JavaScript"];
const monacoLang: Record<string, string> = {
  C: "c",
  "C++": "cpp",
  Python: "python",
  JavaScript: "javascript",
};

function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
  return (
    <Separator
      className={`group flex shrink-0 items-center justify-center bg-border ${
        orientation === "horizontal" ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
      }`}
    >
      <span
        className={`rounded-full bg-border-soft group-hover:bg-primary ${
          orientation === "horizontal" ? "h-8 w-[3px]" : "h-[3px] w-8"
        }`}
      />
    </Separator>
  );
}

export function SolveWorkspace({ problem }: { problem: Problem }) {
  const index = problems.findIndex((p) => p.slug === problem.slug);
  const prev = problems[(index - 1 + problems.length) % problems.length];
  const next = problems[(index + 1) % problems.length];

  const [leftTab, setLeftTab] = useState<"description" | "discussion">("description");
  const [language, setLanguage] = useState(languages[0]);
  const [code, setCode] = useState<Record<string, string>>(problem.starter);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ input: string; expected: string; pass: boolean }[] | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ from: "user" | "ai"; text: string }[]>([
    {
      from: "ai",
      text: "Chào bạn! Mình sẽ gợi ý theo hướng dẫn từng bước, không đưa đáp án hoàn chỉnh. Bạn đang vướng ở đâu?",
    },
  ]);

  const runCode = () => {
    setRunning(true);
    setConsoleTab("result");
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-surface px-3">
        <Link href="/practice" title="Danh sách bài luyện tập" className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy">
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="mx-1 h-5 w-px bg-border" />
        <span className="truncate text-sm font-semibold text-navy">{problem.title}</span>
        <DifficultyBadge difficulty={problem.difficulty} />
        <div className="flex items-center">
          <Link href={`/solve/${prev.slug}`} title="Bài trước" className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link href={`/solve/${next.slug}`} title="Bài tiếp theo" className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-navy">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex-1" />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-navy"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={runCode}
          disabled={running}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy hover:bg-bg disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Chạy
        </button>
        <button className="rounded-md bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy/90">
          Nộp bài
        </button>
        <button
          onClick={() => setAiOpen((v) => !v)}
          title="Trợ lý AI"
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            aiOpen ? "bg-ai-tint text-ai" : "text-text-muted hover:bg-bg hover:text-navy"
          }`}
        >
          <Sparkles className="h-4.5 w-4.5" />
        </button>
      </div>

      <Group orientation="horizontal" className="flex-1">
        <Panel id="description" defaultSize="32%" minSize="20%" maxSize="45%" className="flex min-h-0 flex-col">
          <div className="flex shrink-0 gap-4 border-b border-border px-4 pt-2.5 text-sm font-medium">
            {(["description", "discussion"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`border-b-2 pb-2.5 ${
                  leftTab === t ? "border-navy text-navy" : "border-transparent text-text-faint"
                }`}
              >
                {t === "description" ? "Đề bài" : "Thảo luận"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {leftTab === "description" ? (
              <>
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
              </>
            ) : (
              <div className="text-sm text-text-faint">Chưa có bình luận nào cho bài này.</div>
            )}
          </div>
        </Panel>

        <ResizeHandle orientation="horizontal" />

        <Panel id="workbench" minSize="30%" className="min-h-0">
          <Group orientation="vertical" className="h-full">
            <Panel id="editor" defaultSize="65%" minSize="20%" className="min-h-0">
              <Editor
                key={language}
                language={monacoLang[language]}
                value={code[language]}
                onChange={(v) => setCode((c) => ({ ...c, [language]: v ?? "" }))}
                theme="vs-dark"
                options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 12 } }}
              />
            </Panel>

            <ResizeHandle orientation="vertical" />

            <Panel id="console" defaultSize="35%" minSize="15%" className="flex min-h-0 flex-col bg-surface">
              <div className="flex shrink-0 gap-4 border-b border-border px-4 pt-2 text-sm font-medium">
                {(["testcase", "result"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConsoleTab(t)}
                    className={`border-b-2 pb-2 text-xs ${
                      consoleTab === t ? "border-navy text-navy" : "border-transparent text-text-faint"
                    }`}
                  >
                    {t === "testcase" ? "Testcase" : "Kết quả"}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {consoleTab === "testcase" && (
                  <div className="flex flex-col gap-2">
                    {problem.testCases.map((tc, i) => (
                      <div key={i} className="rounded-md border border-border-soft bg-bg p-2.5 font-mono text-xs">
                        <div className="mb-1 text-text-faint">Input</div>
                        <div className="text-navy">{tc.input}</div>
                      </div>
                    ))}
                  </div>
                )}
                {consoleTab === "result" &&
                  (running ? (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang chạy trong sandbox...
                    </div>
                  ) : results ? (
                    <div className="flex flex-col gap-2">
                      {results.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-md p-2.5 font-mono text-xs ${
                            r.pass ? "bg-success-tint" : "bg-danger-tint"
                          }`}
                        >
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
                  ))}
              </div>
            </Panel>
          </Group>
        </Panel>

        {aiOpen && (
          <>
            <ResizeHandle orientation="horizontal" />
            <Panel id="ai" defaultSize="26%" minSize="18%" maxSize="40%" className="flex min-h-0 flex-col border-l border-ai">
              <div className="flex shrink-0 items-center gap-2 border-b border-border-soft bg-ai-tint px-3 py-2.5">
                <Sparkles className="h-4 w-4 text-ai" />
                <span className="flex-1 text-sm font-bold text-navy">Trợ lý AI</span>
                <button onClick={() => setAiOpen(false)} className="text-text-faint hover:text-navy">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {aiMessages.map((m, i) => (
                  <div key={i} className={`mb-2.5 flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-md px-3 py-2 text-xs leading-relaxed ${
                        m.from === "user" ? "bg-navy text-white" : "bg-ai-tint text-navy"
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
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
}
