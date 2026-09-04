import { ApiClientError } from "@codementor/api-client";

/**
 * Những hàm mà cả bảng bài tập lẫn Studio bài tập đều dùng. Trước đây chúng nằm trong
 * `workspace-content-tabs.tsx` vì Studio còn là hộp thoại trong chính file đó; Studio đã
 * tách sang trang riêng nên chúng ở đây, không phải chép hai bản.
 */
export function messageOf(error: unknown, fallback = "Có lỗi xảy ra") {
  return error instanceof ApiClientError
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseInputOutputPairs(value: string) {
  return splitLines(value).flatMap((line) => {
    const separator = line.includes("=>")
      ? "=>"
      : line.includes("→")
        ? "→"
        : null;
    if (!separator) return [];
    const [input, ...output] = line.split(separator);
    return input.trim() && output.join(separator).trim()
      ? [{ input: input.trim(), output: output.join(separator).trim() }]
      : [];
  });
}

/**
 * Tên các mục trong một đề dán từ nơi khác. Khai một chỗ vì chúng có HAI vai: nhận ra chỗ
 * mục bắt đầu, và nhận ra chỗ mục TRƯỚC nó kết thúc. Trước đây danh sách chặn đuôi được gõ
 * lại bằng tay và chỉ có tiếng Anh, nên đề tiếng Việt không có mục nào chặn "Đề bài" lại —
 * phần mô tả nuốt luôn cả khối ràng buộc, và học viên đọc ràng buộc hai lần.
 */
const SECTION_NAMES = {
  statement: ["Description", "Problem", "Mô tả", "Đề bài"],
  inputFormat: ["Input", "Input Format", "Đầu vào"],
  outputFormat: ["Output", "Output Format", "Đầu ra"],
  constraints: ["Constraint", "Constraints", "Ràng buộc"],
  examples: ["Example", "Examples", "Ví dụ"],
} as const;

/**
 * Nhánh ĐẦU TIÊN khớp là nhánh thắng trong regex, nên phải thử tên dài trước tên ngắn:
 * để "Constraint" trước "Constraints" thì thân mục bắt được bắt đầu bằng chữ "s" thừa —
 * đúng cái đã lọt vào ô Ràng buộc của bài nhập từ LeetCode. "Input" trước "Input Format"
 * cũng vậy.
 */
function alternation(names: readonly string[]) {
  return [...names]
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

export function parseProblemText(raw: string) {
  const text = raw.replace(/\r/g, "").trim();
  const title =
    text
      .split("\n")
      .find((line) => line.trim())
      ?.replace(/^#+\s*/, "") ?? "";
  const headings = alternation(Object.values(SECTION_NAMES).flat());
  const section = (names: readonly string[]) => {
    const match = text.match(
      new RegExp(
        `(?:^|\\n)(?:#+\\s*)?(?:${alternation(names)})\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n(?:#+\\s*)?(?:${headings})\\s*:?|$)`,
        "i",
      ),
    );
    return match?.[1]?.trim() ?? "";
  };
  const statement = section(SECTION_NAMES.statement);
  return {
    title,
    summary: statement.split("\n")[0]?.slice(0, 500) ?? "",
    statement: statement || text,
    inputFormat: section(SECTION_NAMES.inputFormat),
    outputFormat: section(SECTION_NAMES.outputFormat),
    constraints: section(SECTION_NAMES.constraints),
    examples: section(SECTION_NAMES.examples),
  };
}

/** ISO -> giá trị cho `<input type="datetime-local">`, theo múi giờ máy người dùng. */
export function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function slugifyExercise(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
