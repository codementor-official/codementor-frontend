/**
 * Self-check cho phần áp đề nghị của Lecter vào form. Repo chưa có test runner, chạy thẳng:
 *
 *   npx tsx apps/client/src/features/workspace/lecter/patch.test.ts
 *
 * Ca quan trọng nhất: patch chỉ có `statement` KHÔNG được xoá bộ test case đang có. Đó là toàn
 * bộ lý do tồn tại của kiểu "sửa từng phần"; làm sai thì mỗi lần nhờ sửa một câu là mất bài.
 */
import assert from "node:assert/strict";
import type { ExerciseDraft } from "@codementor/solve";
import { applyPatch, changedFields, overwrites, patchEntries } from "./patch";

const draft: ExerciseDraft = {
  slug: "two-sum",
  title: "Two Sum",
  summary: "Tìm cặp có tổng bằng K",
  difficulty: "easy",
  tagIds: ["tag-1"],
  estimatedMinutes: "30",
  timeLimitMs: "1000",
  memoryLimitKb: "262144",
  content: {
    statement: "Đề cũ",
    ioMode: "stdin_stdout",
    testCases: [{ order: 1, input: "1", expected: "1", visibility: "public" }],
    languages: [{ id: "python", label: "Python", referenceSolution: "print(1)" }],
    evaluation: { checker: "trimmed", stopOnFirstFailure: false },
  },
} as ExerciseDraft;

// 1. Sửa một phần thì phần còn lại phải nguyên vẹn.
const rewritten = applyPatch(draft, { content: { statement: "Đề mới" } });
assert.equal(rewritten.content.statement, "Đề mới");
assert.equal(rewritten.content.testCases?.length, 1, "test case không được biến mất");
assert.equal(rewritten.title, "Two Sum");
assert.equal(rewritten.slug, "two-sum", "slug không đổi theo patch");

// 2. Mảng thì thay cả mảng, không trộn từng phần tử.
const recased = applyPatch(draft, {
  content: { testCases: [{ order: 1, input: "2", expected: "2", visibility: "hidden" }] },
});
assert.equal(recased.content.testCases?.length, 1);
assert.equal(recased.content.testCases?.[0].visibility, "hidden");

// 3. Số đi vào form dưới dạng chuỗi — <input> không nhận number.
const retimed = applyPatch(draft, { timeLimitMs: 2000 });
assert.equal(retimed.timeLimitMs, "2000");
assert.equal(retimed.estimatedMinutes, "30");

// 4. Nhãn cho thẻ xác nhận.
assert.deepEqual(changedFields({ title: "x", content: { testCases: [] } }), [
  "Tiêu đề",
  "Test case",
]);

// 5. Chỉ cảnh báo ghi đè khi form ĐANG có nội dung khác.
assert.deepEqual(overwrites(draft, { content: { statement: "Đề mới" } }), ["Đề bài"]);
assert.deepEqual(overwrites(draft, { content: { statement: "Đề cũ" } }), [], "giống hệt thì không phải ghi đè");
assert.deepEqual(
  overwrites({ ...draft, content: { ...draft.content, statement: "" } }, { content: { statement: "Đề mới" } }),
  [],
  "ô rỗng thì điền vào chứ không phải ghi đè",
);

// 6. Thẻ xác nhận phải đọc được NỘI DUNG, không chỉ tên trường.
const entries = patchEntries(draft, {
  content: {
    statement: "Đề mới",
    testCases: [
      { order: 1, input: "1", expected: "1", visibility: "public" },
      { order: 2, input: "2", expected: "2", visibility: "hidden" },
    ],
    languages: [{ id: "javascript", label: "JavaScript", referenceSolution: "console.log(1)" }],
  },
});
const byKey = Object.fromEntries(entries.map((entry) => [entry.key, entry]));
assert.equal(byKey.statement.preview, "Đề mới");
assert.equal(byKey.statement.current, "Đề cũ", "phần bị ghi đè phải mang theo bản đang có");
assert.match(byKey.testCases.preview, /^2 case \(1 công khai\)/);
assert.match(byKey.testCases.preview, /#2 \[hidden\] 2 → 2/);
assert.match(byKey.languages.preview, /javascript \(JavaScript\)\nconsole\.log\(1\)/);

// Ô trống thì không phải "ghi đè" — không mang bản cũ theo.
const filling = patchEntries({ ...draft, summary: "" } as ExerciseDraft, { summary: "Tóm tắt mới" });
assert.equal(filling[0].current, undefined);

console.log("patch.test.ts OK");
