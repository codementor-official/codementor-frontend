import { BookOpen, Code2, type LucideIcon } from "lucide-react";

export type ProblemTabKey = "code" | "theory";

export interface ProblemTab {
  key: ProblemTabKey;
  label: string;
  icon: LucideIcon;
}

// Quiz and essay authoring had tabs but no form — they rendered a dashed placeholder box.
// Add them back alongside a real form, not before one.
export const PROBLEM_TABS: ProblemTab[] = [
  { key: "code", label: "Code", icon: Code2 },
  { key: "theory", label: "Lý thuyết", icon: BookOpen },
];

export function resolveProblemTab(raw: string | undefined): ProblemTabKey {
  return PROBLEM_TABS.find((t) => t.key === raw)?.key ?? "code";
}
