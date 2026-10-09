"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";
import { Code2, ListChecks } from "lucide-react";
import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { showValue } from "@codementor/solve";
import type { Problem } from "@/data/sample-problem";
import { AgentHeaderSync, useAgentHeaders } from "@/features/agent-chat/agent-headers";
import type { JudgeRunResult } from "@/types/judge";

/** Chỉ gửi vài case fail đầu: một bài fail cả 50 test sẽ nổ context, và case thứ tư trở đi
 *  không thêm thông tin gì mà học viên chưa thấy ở ba case trước. */
const MAX_FAILING = 3;
const FIELD_CHARS = 500;

/**
 * Nhãn bài của lượt này, để danh sách lịch sử nói rõ hội thoại thuộc bài nào.
 *
 * Phải `encodeURIComponent`: header HTTP là latin-1 còn tên bài thì có dấu. Gửi thô là lỗi mã
 * hoá ở tầng Node, và nó chỉ nổ với bài có dấu nên rất dễ lọt qua một vòng thử tiếng Anh.
 */
function scopeLabel(exerciseTitle: string): Record<string, string> {
  return { "x-agent-scope-label": encodeURIComponent(exerciseTitle) };
}

/** Header ban đầu cho `<CopilotKitProvider headers>` — xem `useAgentHeaders`. */
export function useCodeyHeaders(exerciseTitle: string): Record<string, string> {
  return useAgentHeaders(scopeLabel(exerciseTitle));
}

/** Token hiện hành và nhãn bài — xem `AgentHeaderSync`. */
export function CodeyHeaderSync({ exerciseTitle }: { exerciseTitle: string }) {
  return <AgentHeaderSync extra={scopeLabel(exerciseTitle)} />;
}

/**
 * Đề bài — ngữ cảnh ỔN ĐỊNH, không phải tool.
 *
 * Gần như câu hỏi nào cũng cần tới nó, nên một lời gọi tool để lấy đề là một vòng chờ thừa cho
 * mọi lượt. Và vì nó không đổi trong suốt phiên, nó nằm ở phần ĐẦU prompt — chỗ OpenAI cache
 * được. Code học viên thì ngược lại: đổi theo từng phím gõ, nên nó đi bằng tool và rơi vào phần
 * lịch sử phía sau, không phá cache.
 *
 * Chỉ gồm thứ trình duyệt vốn đã hiển thị. `toLearnerExerciseContent` của exercise-service đã
 * bỏ lời giải mẫu, test case ẩn và checker trước khi trả về, nên không có gì bí mật để rò.
 */
export function CodeyProblemContext({
  problem,
  language,
}: {
  problem: Problem;
  language: string;
}) {
  useAgentContext({
    description: "Bài code học viên đang mở",
    value: {
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.description,
      constraints: problem.constraints,
      tags: problem.tags,
      language,
      // Chuỗi hoá bằng `showValue` — cùng hàm mà tab Testcase đang hiện cho học viên, nên thứ
      // Codey đọc và thứ họ nhìn thấy là một. Kiểu gốc là `unknown` nên cũng không nhét thẳng
      // vào ngữ cảnh JSON được.
      publicTestCases: (problem.publicTestCases ?? problem.testCases).slice(0, 5).map((testCase) => ({
        args: testCase.args ? testCase.args.map((arg) => showValue(arg)) : null,
        input: testCase.input === undefined ? null : showValue(testCase.input),
        expected: showValue(testCase.expected),
      })),
    },
  });
  return null;
}

/** Cắt một trường dài của bộ chấm. `stderr` của một stack trace dài có thể vài chục KB. */
function clip(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > FIELD_CHARS ? `${text.slice(0, FIELD_CHARS)}… (đã cắt bớt)` : text;
}

/** Đánh số dòng 1-based, khớp với số Monaco hiện ở lề trái — để Codey nói "dòng 12 của bạn"
 *  và học viên nhìn đúng vào dòng đó. */
function numbered(code: string): string {
  return code
    .split("\n")
    .map((line, index) => `${index + 1} | ${line}`)
    .join("\n");
}

/**
 * Hai tool ĐỌC phía trình duyệt. Không có tool server nào, và đó là biên bảo mật của Codey —
 * xem `app/codey/capability.py`.
 *
 * Cả hai đăng ký MỘT LẦN (`deps: []`) và đọc dữ liệu mới nhất qua ref: `useFrontendTool` gỡ rồi
 * gắn lại tool mỗi khi deps đổi, mà `code` đổi theo từng phím gõ — đăng ký lại giữa một lượt
 * chạy sẽ huỷ chính lời gọi đang chờ.
 */
export function CodeyTools({
  code,
  language,
  judgeResult,
  judgeError,
}: {
  code: string;
  language: string;
  judgeResult: JudgeRunResult | null;
  judgeError: string | null;
}) {
  const latest = useRef({ code, language, judgeResult, judgeError });
  useEffect(() => {
    latest.current = { code, language, judgeResult, judgeError };
  }, [code, language, judgeResult, judgeError]);

  useFrontendTool(
    {
      name: "read_editor_code",
      description:
        "Đọc code học viên đang viết trong trình soạn thảo, kèm số dòng. Gọi khi câu hỏi liên " +
        "quan tới code của họ. Đừng đoán code trong đầu rồi nhận xét.",
      parameters: z.object({}),
      handler: async () => {
        const { code: source, language: lang } = latest.current;
        if (!source.trim()) return "Trình soạn thảo đang trống — học viên chưa viết gì.";
        return `Ngôn ngữ: ${lang}\n\n${numbered(source)}`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      name: "read_last_run",
      description:
        "Đọc kết quả chạy gần nhất: verdict, số test đạt, vài test chưa đạt đầu tiên, lỗi biên " +
        "dịch. Gọi khi câu hỏi liên quan tới lỗi, test sai hay kết quả chạy.",
      parameters: z.object({}),
      handler: async () => {
        const { judgeResult: result, judgeError: error } = latest.current;
        if (error) return `Lần chạy gần nhất hỏng ở phía hệ thống chấm: ${clip(error)}`;
        if (!result) return "Học viên chưa chạy bài lần nào trong phiên này.";
        const failing = result.cases
          .filter((one) => one.verdict !== "accepted")
          .slice(0, MAX_FAILING)
          .map((one) => ({
            order: one.order,
            verdict: one.verdict,
            expected: clip(one.expected),
            actual: clip(one.actual),
            stderr: one.stderr ? clip(one.stderr) : undefined,
          }));
        return JSON.stringify({
          verdict: result.verdict,
          passedTests: result.passedTests,
          totalTests: result.totalTests,
          runtimeMs: result.runtimeMs,
          compileOutput: result.compileOutput ? clip(result.compileOutput) : undefined,
          failingCases: failing,
          note:
            failing.length < result.totalTests - result.passedTests
              ? `Chỉ liệt kê ${failing.length} test chưa đạt đầu tiên.`
              : undefined,
        });
      },
    },
    [],
  );

  return null;
}

/** Nhãn tiếng Việt cho dòng trạng thái tool trong khung chat. */
export const TOOL_LABELS: Record<string, { label: string; icon: typeof Code2 }> = {
  read_editor_code: { label: "Đọc code bạn đang viết", icon: Code2 },
  read_last_run: { label: "Đọc kết quả chạy gần nhất", icon: ListChecks },
};
