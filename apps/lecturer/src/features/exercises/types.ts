export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "rejected",
  "published",
  "closed",
  "hidden",
  "archived",
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type ExerciseStatus = (typeof STATUSES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};

export const STATUS_LABELS: Record<ExerciseStatus, string> = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  changes_requested: "Cần sửa",
  rejected: "Bị từ chối",
  published: "Đã công khai",
  closed: "Đã đóng",
  hidden: "Đã ẩn",
  archived: "Đã gỡ",
};

/** StatusBadge chỉ có bốn tông; tám trạng thái phải gom về đó. */
export const STATUS_TONES: Record<ExerciseStatus, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  pending_review: "warning",
  changes_requested: "warning",
  rejected: "danger",
  published: "success",
  closed: "neutral",
  hidden: "neutral",
  archived: "neutral",
};

/** Hàng trong bảng — API danh sách không trả thân bài. */
export interface ExerciseListItem {
  id: string;
  slug: string;
  title: string;
  kind: string;
  difficulty: Difficulty;
  status: ExerciseStatus;
  visibility: string;
  authorId: string | null;
  authorName: string | null;
  forkedFromId: string | null;
  updatedAt: string;
}

export interface TestCase {
  order: number;
  input: string;
  expected: string;
  visibility: "public" | "hidden";
  generated?: boolean;
  weight?: number;
}

export interface LanguageConfig {
  id: string;
  label: string;
  monaco?: string;
  starterCode?: string;
  referenceSolution?: string;
}

/** Khớp validator của collection `exercise_contents`; thừa một trường là Mongo từ chối. */
export interface ExerciseContent {
  statement?: string;
  constraints?: string[];
  hints?: { order: number; text: string; xpPenalty?: number }[];
  examples?: { input: string; output: string; explanation?: string }[];
  testCases?: TestCase[];
  languages?: LanguageConfig[];
  evaluation?: {
    checker?: "exact" | "trimmed" | "float" | "custom";
    floatTolerance?: number;
    customCheckerCode?: string;
    stopOnFirstFailure?: boolean;
  };
  theory?: { summary?: string; objectives?: string[]; contentHtml?: string };
}

export interface Exercise extends Omit<ExerciseListItem, "authorName"> {
  summary: string | null;
  xpReward: number;
  estimatedMinutes: number | null;
  timeLimitMs: number;
  memoryLimitKb: number;
  rejectionReason: string | null;
  publishedAt: string | null;
  content?: ExerciseContent | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Ngôn ngữ chào ra ở studio. `monaco` là id Monaco dùng để tô màu. */
export const LANGUAGES: LanguageConfig[] = [
  { id: "c", label: "C", monaco: "c" },
  { id: "cpp", label: "C++", monaco: "cpp" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "go", label: "Go", monaco: "go" },
];
