import {
  Code2,
  FileText,
  History,
  ListChecks,
  MessageSquare,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import type { PaneState, PanesState, TabMetaMap } from "@codementor/ui";

/** Closed union so this screen's `switch` over tab content stays exhaustive. */
export type TabKind = "description" | "discussion" | "code" | "testcase" | "result" | "history" | "ai";

export type PaneId = "left" | "editor" | "console" | "ai";

export const TAB_META: TabMetaMap = {
  description: { label: "Đề bài", icon: FileText, iconClassName: "text-foreground" },
  discussion: { label: "Thảo luận", icon: MessageSquare, iconClassName: "text-foreground" },
  code: { label: "Code", icon: Code2, iconClassName: "text-primary" },
  testcase: { label: "Testcase", icon: ListChecks, iconClassName: "text-foreground" },
  result: { label: "Kết quả", icon: SquareTerminal, iconClassName: "text-foreground" },
  history: { label: "Lịch sử nộp", icon: History, iconClassName: "text-foreground" },
  ai: { label: "Trợ lý AI", icon: Sparkles, iconClassName: "text-primary", closable: true },
};

export type { PaneState, PanesState };
