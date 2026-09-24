"use client";

import { useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { Code2, ListChecks } from "lucide-react";
import { useAgentContext, useCopilotKit, useFrontendTool } from "@copilotkit/react-core/v2";
import { showValue } from "@codementor/solve";
import type { Problem } from "@/data/sample-problem";
import { currentAccessToken } from "@/lib/api";
import type { JudgeRunResult } from "@/types/judge";

/** Trễ tối đa giữa lúc token được gia hạn và lúc CopilotKit biết. */
const TOKEN_SYNC_MS = 30_000;
/** Chỉ gửi vài case fail đầu: một bài fail cả 50 test sẽ nổ context, và case thứ tư trở đi
 *  không thêm thông tin gì mà học viên chưa thấy ở ba case trước. */
const MAX_FAILING = 3;
const FIELD_CHARS = 500;

/**
 * `null` với phiên đăng nhập bằng mật khẩu — token của họ nằm trong cookie HttpOnly và tầng Node
 * `/api/copilotkit` gắn hộ. Gửi `"Bearer "` rỗng thì tầng đó tưởng trình duyệt đã có token và
 * chuyển tiếp một header hỏng, nên ở đây phải là "không gửi gì cả".
 */
function bearer(): string | null {
  const token = currentAccessToken();
  return token ? `Bearer ${token}` : null;
}

/**
 * Header ban đầu cho `<CopilotKitProvider headers>`.
 *
 * Bắt buộc, dù `CodeyHeaderSync` đã tồn tại: effect của provider chạy SAU effect của con, gọi
 * `setHeaders(prop headers)` rồi `connect()` ngay trong đó. Không truyền prop này thì lượt
 * `/info` đầu tiên đi ra với header rỗng — phiên popup (token trong tab, không có cookie) nhận
 * 401, và mọi lượt chạy trong 30 giây đầu cũng vậy, tới khi vòng sync kịp gắn lại.
 *
 * Memo theo CHUỖI token: đổi object mỗi lần render là provider chạy lại effect và reconnect.
 */
export function useCodeyHeaders(exerciseTitle: string): Record<string, string> {
  const token = bearer();
  return useMemo(
    () => ({
      ...(token ? { Authorization: token } : {}),
      "x-agent-scope-label": encodeURIComponent(exerciseTitle),
    }),
    [token, exerciseTitle],
  );
}

/**
 * Giữ header của CopilotKit đúng: token hiện hành, và tên bài để gắn nhãn hội thoại.
 *
 * `AuthProvider` giữ token trong `useRef` và cố tình không re-render khi token được gia hạn
 * (~5 phút một lần), còn CopilotKit thì trải phẳng prop `headers` MỘT LẦN rồi giữ bản sao — nên
 * getter hay hàm đặt trong prop đó đều vô dụng, và không có cầu nối này thì sau ~5 phút mọi lượt
 * trả 401.
 *
 * So sánh với `copilotkit.headers` chứ không với một ref cục bộ: `CopilotKitProvider` cũng gọi
 * `setHeaders(mergedHeaders)` trong effect CỦA CHÍNH NÓ, mà effect của cha chạy SAU effect của
 * con — mọi giá trị đặt ở đây lúc mount đều bị nó ghi đè. Đọc lại trạng thái thật của core khiến
 * vòng này tự chữa.
 *
 * Tiêu đề phải `encodeURIComponent`: header HTTP là latin-1 còn tên bài thì có dấu. Gửi thô là
 * lỗi mã hoá ở tầng Node, và nó chỉ nổ với bài có dấu nên rất dễ lọt qua một vòng thử tiếng Anh.
 */
export function CodeyHeaderSync({ exerciseTitle }: { exerciseTitle: string }) {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    const label = encodeURIComponent(exerciseTitle);
    const apply = () => {
      const token = bearer();
      const current = copilotkit.headers ?? {};
      // Phiên mật khẩu không có token trong tab: vẫn phải gắn nhãn bài, chỉ là không có
      // `Authorization` để gắn.
      const next = { ...(token ? { Authorization: token } : {}), "x-agent-scope-label": label };
      if (current.Authorization === next.Authorization && current["x-agent-scope-label"] === label) {
        return;
      }
      copilotkit.setHeaders(next);
    };
    apply();
    const timer = setInterval(apply, TOKEN_SYNC_MS);
    return () => clearInterval(timer);
  }, [copilotkit, exerciseTitle]);

  return null;
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
