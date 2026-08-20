import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES } from "@codementor/types";

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

/**
 * Sáu trạng thái đầu dùng chung với khoá học và lộ trình, lấy thẳng từ `@codementor/types`;
 * `closed` và `hidden` chỉ bài code mới có. Chép lại cả bảng thì một hôm nào đó "Đã gỡ" bên
 * này và "Đã lưu trữ" bên kia cùng nói về một trạng thái.
 */
export const STATUS_LABELS: Record<ExerciseStatus, string> = {
  ...CONTENT_STATUS_LABELS,
  closed: "Đã đóng",
  hidden: "Đã ẩn",
};

/** StatusBadge chỉ có bốn tông; tám trạng thái phải gom về đó. */
export const STATUS_TONES: Record<ExerciseStatus, "neutral" | "success" | "warning" | "danger"> = {
  ...CONTENT_STATUS_TONES,
  closed: "neutral",
  hidden: "neutral",
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
  /** stdin/stdout: đầu vào nạp qua stdin. */
  input?: string;
  /** Chế độ hàm: tham số theo VỊ TRÍ, khớp thứ tự `signature.parameters`. */
  args?: unknown[];
  /** Chuỗi ở chế độ stdin; giá trị JSON bất kỳ ở chế độ hàm. */
  expected?: unknown;
  visibility: "public" | "hidden";
  /** `true` khi đáp án do chạy lời giải mẫu sinh ra, `false` khi tác giả gõ tay. */
  generated?: boolean;
  weight?: number;
}

/** Nút của Type IR — độc lập ngôn ngữ. `{ kind: "list", of: { kind: "float" } }`. */
export interface TypeIR {
  kind: string;
  of?: TypeIR;
  key?: TypeIR;
  value?: TypeIR;
}

export interface FunctionParameter {
  name: string;
  type: TypeIR;
  description?: string;
}

export interface FunctionSignature {
  /** snake_case; bộ sinh code đổi sang camelCase cho JS/Java. */
  functionName: string;
  parameters: FunctionParameter[];
  returnType: TypeIR;
}

export type IoMode = "stdin_stdout" | "function";

/**
 * Phần `spec` gửi cho judge.
 *
 * Một kiểu dùng chung cho cả `judge.run` lẫn `judge.starter`: hai lời gọi phải mô tả CÙNG một
 * chữ ký, và lần đầu chúng được khai riêng thì `run` quên mất `parameters` — driver Go sinh
 * ra một lời gọi không tham số và bài không dịch được.
 */
export interface JudgeSpecPayload {
  functionName: string;
  parameters: FunctionParameter[];
  returnType: TypeIR;
  judgeMode?: "exact" | "float" | "unordered";
  judgeConfig?: Record<string, number>;
}

/**
 * Thân yêu cầu `POST /judge/run`.
 *
 * Khai ở đây chứ không ở từng ứng dụng: màn hình giải bài dùng chung phải mô tả được lời
 * gọi mà nó cần, còn ai gửi lời gọi đó đi (giảng viên qua Kong, admin qua BFF) là chuyện
 * của ứng dụng.
 */
export interface JudgeRunPayload {
  language: string;
  sourceCode: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  /** Có mặt = chấm theo chữ ký hàm. Vắng mặt = so chuỗi stdout như trước. */
  spec?: JudgeSpecPayload;
  testCases: {
    order: number;
    input?: string;
    args?: unknown[];
    expected?: unknown;
    weight?: number;
  }[];
}

/**
 * Kiểu chọn được ở form ra đề, dạng phẳng.
 *
 * Type IR cho phép lồng tuỳ ý, nhưng giai đoạn này chỉ mở tới hai cấp — đủ cho gần hết bài
 * và giữ form là một ô select thay vì một cây.
 */
export const TYPE_OPTIONS: { value: string; label: string; ir: TypeIR }[] = [
  { value: "int", label: "Số nguyên", ir: { kind: "int" } },
  { value: "float", label: "Số thực", ir: { kind: "float" } },
  { value: "bool", label: "Đúng/Sai", ir: { kind: "bool" } },
  { value: "string", label: "Chuỗi", ir: { kind: "string" } },
  { value: "list<int>", label: "Danh sách số nguyên", ir: { kind: "list", of: { kind: "int" } } },
  { value: "list<float>", label: "Danh sách số thực", ir: { kind: "list", of: { kind: "float" } } },
  { value: "list<string>", label: "Danh sách chuỗi", ir: { kind: "list", of: { kind: "string" } } },
  {
    value: "list<list<int>>",
    label: "Ma trận số nguyên",
    ir: { kind: "list", of: { kind: "list", of: { kind: "int" } } },
  },
  {
    value: "map<string,int>",
    label: "Từ điển chuỗi → số nguyên",
    ir: { kind: "map", key: { kind: "string" }, value: { kind: "int" } },
  },
  { value: "void", label: "Không trả về", ir: { kind: "void" } },
];

/**
 * Giá trị của test case → text để hiển thị.
 *
 * `input`/`expected` là chuỗi ở chế độ stdin và giá trị JSON ở chế độ hàm, nên mọi chỗ hiện
 * chúng đều phải đi qua đây; `String(value)` sẽ ra `[object Object]` cho map và `1,2` cho
 * mảng — cả hai đều không phải thứ tác giả đã nhập.
 */
export function showValue(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Type IR → khoá của `TYPE_OPTIONS`. Dùng để chọn lại đúng ô select khi mở bài đã lưu. */
export function typeKey(type: TypeIR | undefined): string {
  if (!type) return "int";
  if (type.kind === "list") return `list<${typeKey(type.of)}>`;
  if (type.kind === "map") return `map<${typeKey(type.key)},${typeKey(type.value)}>`;
  return type.kind;
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
  /** Vắng mặt = `stdin_stdout`. Bài soạn trước khi có chế độ hàm giữ nguyên đường cũ. */
  ioMode?: IoMode;
  signature?: FunctionSignature;
  constraints?: string[];
  hints?: { order: number; text: string; xpPenalty?: number }[];
  examples?: { input: string; output: string; explanation?: string }[];
  testCases?: TestCase[];
  languages?: LanguageConfig[];
  evaluation?: {
    checker?: "exact" | "trimmed" | "float" | "custom" | "unordered";
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
  removalRequested: boolean;
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
  { id: "typescript", label: "TypeScript", monaco: "typescript" },
  { id: "go", label: "Go", monaco: "go" },
  { id: "php", label: "PHP", monaco: "php" },
];

/**
 * Kết quả chấm một test case, trả về từ POST /judge/run.
 *
 * `expected` và `actual` luôn là chuỗi kể cả ở chế độ hàm: judge serialize giá trị bằng
 * `json.dumps` trước khi trả về, nên `[2.0, 1.0]` tới đây đã sẵn sàng để hiển thị.
 */
export interface JudgeCaseResult {
  order: number;
  verdict: JudgeVerdict;
  expected: string;
  actual: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
}

export type JudgeVerdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "memory_exceeded"
  | "skipped";

export interface JudgeRunResult {
  verdict: JudgeVerdict;
  score: number;
  passedTests: number;
  totalTests: number;
  runtimeMs: number;
  memoryKb: number;
  /** Chỉ có khi verdict là compile_error. */
  compileOutput: string | null;
  /**
   * Những gì học viên `print` ra. Rỗng ở chế độ stdin — ở đó stdout CHÍNH LÀ bài nộp và đã
   * nằm trong `cases[].actual`.
   */
  consoleOutput: string;
  /** Rỗng khi biên dịch hỏng — không case nào được chạy. */
  cases: JudgeCaseResult[];
}

export const VERDICT_LABELS: Record<JudgeVerdict, string> = {
  accepted: "Đạt",
  wrong_answer: "Sai kết quả",
  compile_error: "Lỗi biên dịch",
  runtime_error: "Lỗi khi chạy",
  timeout: "Quá thời gian",
  memory_exceeded: "Quá bộ nhớ",
  skipped: "Chưa chạy",
};

export const VERDICT_TONES: Record<JudgeVerdict, "neutral" | "success" | "warning" | "danger"> = {
  accepted: "success",
  wrong_answer: "danger",
  compile_error: "warning",
  runtime_error: "danger",
  timeout: "warning",
  memory_exceeded: "warning",
  skipped: "neutral",
};

/**
 * Ngôn ngữ chạy được ở chế độ hàm — hiện là tất cả.
 *
 * Danh sách vẫn tồn tại riêng vì mỗi ngôn ngữ ở đây cần một driver riêng phía judge; ngôn ngữ
 * thứ chín sẽ dùng được ở chế độ stdin trước khi có mặt ở đây.
 *
 * Một chữ ký cụ thể vẫn có thể không diễn tả được ở một ngôn ngữ nào đó (C không có `map`).
 * Chuyện đó judge trả lời qua `unsupported` của `POST /judge/starter`, không đoán ở client.
 */
export const FUNCTION_MODE_LANGUAGES = [
  "python",
  "javascript",
  "typescript",
  "java",
  "go",
  "php",
  "c",
  "cpp",
] as const;

export function supportsFunctionMode(languageId: string): boolean {
  return (FUNCTION_MODE_LANGUAGES as readonly string[]).includes(languageId);
}
