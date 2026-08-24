import type { JudgeVerdict } from "@codementor/solve";

export type {
  JudgeCaseResult,
  JudgeRunResult,
  JudgeVerdict,
} from "@codementor/solve";

export const VERDICT_LABELS: Record<JudgeVerdict, string> = {
  accepted: "Tất cả test case đã đạt",
  wrong_answer: "Có test case chưa đúng",
  compile_error: "Lỗi biên dịch",
  runtime_error: "Lỗi khi chạy",
  timeout: "Quá thời gian cho phép",
  memory_exceeded: "Quá bộ nhớ cho phép",
  skipped: "Chưa chạy",
};
