"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, FileText, ListChecks, SquareTerminal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Group, Panel } from "react-resizable-panels";
import {
  Pane,
  ResizeHandle,
  SegmentedTabs,
  StatusBadge,
  WorkspaceProvider,
  type PanesState,
  type TabMetaMap,
} from "@codementor/ui";
import { CodeEditor } from "@codementor/editor";
import {
  DIFFICULTY_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  type Exercise,
  type ExerciseStatus,
} from "@/features/exercises/types";

/** Closed union so the content switch below stays exhaustive when a tab is added. */
type SolveTab = "description" | "code" | "testcase" | "result";

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

/**
 * The exercise as a learner meets it: statement on the left, editor top right, cases
 * below — the same three-pane split as the web client's solve screen, built on the same
 * primitives.
 *
 * No mascot, no AI assistant, no discussion tab. Those run on sample data in apps/web;
 * bringing them here would show an author invented conversation about their own exercise.
 */
export function SolvePreview({ exercise, theme }: { exercise: Exercise; theme: "light" | "dark" }) {
  const [languageId, setLanguageId] = useState(() => exercise.content?.languages?.[0]?.id ?? "");
  const [code, setCode] = useState(() => exercise.content?.languages?.[0]?.starterCode ?? "");

  const languages = exercise.content?.languages ?? [];
  const language = languages.find((item) => item.id === languageId);
  const publicCases = useMemo(
    () => (exercise.content?.testCases ?? []).filter((item) => item.visibility === "public"),
    [exercise],
  );

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
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2 py-1.5">
              <span className="truncate font-mono text-xs text-muted-foreground">
                {language ? `solution.${language.id}` : "chưa chọn ngôn ngữ"}
              </span>
              {languages.length > 0 && (
                <SegmentedTabs
                  onChange={(value) => {
                    setLanguageId(value);
                    setCode(languages.find((item) => item.id === value)?.starterCode ?? "");
                  }}
                  options={languages.map((item) => ({ value: item.id, label: item.label }))}
                  value={languageId}
                />
              )}
            </div>
            <div className="min-h-0 flex-1">
              {language ? (
                <CodeEditor
                  height="100%"
                  language={language.monaco ?? language.id}
                  onChange={setCode}
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
                    <p className="font-sans text-muted-foreground">Đầu vào</p>
                    <pre className="mt-1 whitespace-pre-wrap">{testCase.input || "(rỗng)"}</pre>
                    <p className="mt-2 font-sans text-muted-foreground">Đầu ra</p>
                    <pre className="mt-1 whitespace-pre-wrap">{testCase.expected || "(rỗng)"}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "result":
        return (
          <div className="h-full overflow-y-auto p-3">
            <p className="text-sm text-muted-foreground">
              Chưa chấm được: judge-service chưa có sandbox chạy code.
            </p>
          </div>
        );
    }
  };

  return (
    <WorkspaceProvider initialPanes={INITIAL_PANES} tabMeta={TAB_META}>
      <div className="flex h-full flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <Link
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            href="/exercises"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Bài code
          </Link>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{exercise.title}</span>
          <Link
            className="flex h-8 items-center rounded-md border px-2.5 text-xs font-medium"
            href={`/exercises/${exercise.id}/studio`}
          >
            Mở studio
          </Link>
        </div>

        <div className="min-h-0 flex-1">
          <Group orientation="horizontal" className="h-full">
            <Panel id="left" defaultSize="42%" minSize="20%" className="min-h-0">
              <Pane<SolveTab> id="left" className="min-h-0">
                {renderTab}
              </Pane>
            </Panel>

            <ResizeHandle orientation="horizontal" />

            <Panel id="workbench" defaultSize="58%" minSize="30%" className="min-h-0">
              <Group orientation="vertical" className="h-full">
                <Panel id="editor" defaultSize="62%" minSize="20%" className="min-h-0">
                  <Pane<SolveTab> id="editor" className="min-h-0">
                    {renderTab}
                  </Pane>
                </Panel>
                <ResizeHandle orientation="vertical" />
                <Panel id="console" defaultSize="38%" minSize="15%" className="min-h-0">
                  <Pane<SolveTab> id="console" className="min-h-0">
                    {renderTab}
                  </Pane>
                </Panel>
              </Group>
            </Panel>
          </Group>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
