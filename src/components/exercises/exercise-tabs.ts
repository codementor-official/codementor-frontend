import { ClipboardList, FileCheck2, type LucideIcon } from "lucide-react";

export type ExerciseTabKey = "authored" | "submissions";

export interface ExerciseTab {
  key: ExerciseTabKey;
  label: string;
  icon: LucideIcon;
}

export const EXERCISE_TABS: ExerciseTab[] = [
  { key: "authored", label: "Bài tập", icon: ClipboardList },
  { key: "submissions", label: "Bài đã nộp", icon: FileCheck2 },
];

export function resolveExerciseTab(raw: string | undefined): ExerciseTabKey {
  return EXERCISE_TABS.find((t) => t.key === raw)?.key ?? "authored";
}
