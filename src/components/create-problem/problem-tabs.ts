import { Code2, ListChecks, PenLine, type LucideIcon } from "lucide-react";

export type ProblemTabKey = "code" | "quiz" | "essay";

export interface ProblemTab {
  key: ProblemTabKey;
  label: string;
  icon: LucideIcon;
}

export const PROBLEM_TABS: ProblemTab[] = [
  { key: "code", label: "Code", icon: Code2 },
  { key: "quiz", label: "Trắc nghiệm", icon: ListChecks },
  { key: "essay", label: "Tự luận", icon: PenLine },
];

export function resolveProblemTab(raw: string | undefined): ProblemTabKey {
  return PROBLEM_TABS.find((t) => t.key === raw)?.key ?? "code";
}
