/** Từ vựng verdict của `JudgeCompletedV1` (codementor-backend/libs/contracts). */
export type JudgeVerdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "memory_exceeded";

export interface JudgeCaseResult {
  order: number;
  verdict: JudgeVerdict;
  expected: string;
  actual: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
}

export interface JudgeRunResult {
  verdict: JudgeVerdict;
  score: number;
  passedTests: number;
  totalTests: number;
  runtimeMs: number;
  memoryKb: number;
  /** Chỉ có khi verdict là compile_error. */
  compileOutput: string | null;
  /** Rỗng khi biên dịch hỏng — không case nào được chạy. */
  cases: JudgeCaseResult[];
}

export const VERDICT_LABELS: Record<JudgeVerdict, string> = {
  accepted: "Tất cả test case đã đạt",
  wrong_answer: "Có test case chưa đúng",
  compile_error: "Lỗi biên dịch",
  runtime_error: "Lỗi khi chạy",
  timeout: "Quá thời gian cho phép",
  memory_exceeded: "Quá bộ nhớ cho phép",
};

/** Tên ngôn ngữ hiển thị ở trang solve sang id mà judge hiểu. */
export const JUDGE_LANGUAGE_IDS: Record<string, string> = {
  C: "c",
  "C++": "cpp",
  Python: "python",
  Java: "java",
  JavaScript: "javascript",
};
