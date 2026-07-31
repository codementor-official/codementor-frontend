import {
  Code2,
  FileText,
  ListChecks,
  MessageSquare,
  Sparkles,
  SquareTerminal,
  type LucideIcon,
} from "lucide-react";

export type TabKind = "description" | "discussion" | "code" | "testcase" | "result" | "ai";

export interface TabMeta {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  closable?: boolean;
}

export const TAB_META: Record<TabKind, TabMeta> = {
  description: { label: "Đề bài", icon: FileText, iconClassName: "text-navy" },
  discussion: { label: "Thảo luận", icon: MessageSquare, iconClassName: "text-navy" },
  code: { label: "Code", icon: Code2, iconClassName: "text-primary" },
  testcase: { label: "Testcase", icon: ListChecks, iconClassName: "text-navy" },
  result: { label: "Kết quả", icon: SquareTerminal, iconClassName: "text-navy" },
  ai: { label: "Trợ lý AI", icon: Sparkles, iconClassName: "text-primary", closable: true },
};

export type PaneId = "left" | "editor" | "console" | "ai";

export interface PaneState {
  tabs: TabKind[];
  active: TabKind | null;
}

export type PanesState = Record<PaneId, PaneState>;
