import type { Difficulty } from "@/components/ui/badge";

/**
 * The backend speaks `CurrentLevel` (`none`/`basic`/`intermediate`/`experienced`) for
 * roadmaps and courses, and `ExerciseDifficulty` (`easy`/`medium`/`hard`) for exercises.
 * The UI has one three-step badge. These are the two mappings onto it, in one place so a
 * new surface cannot invent a third.
 */
const LEVEL_TO_DIFFICULTY: Record<string, Difficulty> = {
  none: "Cơ bản",
  basic: "Cơ bản",
  intermediate: "Trung bình",
  experienced: "Nâng cao",
};

const EXERCISE_TO_DIFFICULTY: Record<string, Difficulty> = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};

export function levelToDifficulty(level: string): Difficulty {
  return LEVEL_TO_DIFFICULTY[level] ?? "Cơ bản";
}

export function exerciseDifficulty(difficulty: string): Difficulty {
  return EXERCISE_TO_DIFFICULTY[difficulty] ?? "Cơ bản";
}

export const LEVEL_OPTIONS = [
  { value: "all", label: "Mọi trình độ" },
  { value: "none", label: "Chưa có nền" },
  { value: "basic", label: "Cơ bản" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "experienced", label: "Nâng cao" },
];

export const DIFFICULTY_OPTIONS = [
  { value: "all", label: "Mọi độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" },
];

/** Backend `field` codes for roadmaps, with the labels the lecturer app already uses. */
export const FIELD_OPTIONS = [
  { value: "all", label: "Mọi lĩnh vực" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Fullstack" },
  { value: "mobile", label: "Mobile" },
  { value: "data_ai", label: "Data & AI" },
  { value: "foundation", label: "Nền tảng" },
];

export const FIELD_LABEL: Record<string, string> = Object.fromEntries(
  FIELD_OPTIONS.filter((o) => o.value !== "all").map((o) => [o.value, o.label]),
);
