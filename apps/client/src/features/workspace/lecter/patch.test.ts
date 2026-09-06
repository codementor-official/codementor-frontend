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
import { applyPatch, changedFields, overwrites } from "./patch";

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

console.log("patch.test.ts OK");
