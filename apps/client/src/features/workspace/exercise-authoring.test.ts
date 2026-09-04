/**
 * Self-check cho bộ tách đề dán từ nền tảng khác. Chưa có test runner trong repo này nên
 * chạy trực tiếp:
 *
 *   pnpm --filter @codementor/client exec tsx src/features/workspace/exercise-authoring.test.ts
 */
import assert from "node:assert/strict";
import { parseProblemText, splitLines } from "./exercise-authoring";

const leetcode = `Two Sum
Description
Given an array of integers nums and an integer target, return indices of the two numbers.
Input Format
First line contains n and target.
Output Format
Two indices.
Constraints
2 <= n <= 10000
-1000 <= nums[i] <= 1000
Examples
2 7 11 15, 9 => 0 1`;

const parsed = parseProblemText(leetcode);

assert.equal(parsed.title, "Two Sum");

// Tên mục dài phải được thử trước tên ngắn. Trước khi sửa, "Constraint" khớp trước
// "Constraints" nên phần thân bắt đầu bằng chữ "s" thừa và nó lọt thẳng vào ô Ràng buộc.
assert.deepEqual(splitLines(parsed.constraints), [
  "2 <= n <= 10000",
  "-1000 <= nums[i] <= 1000",
]);

// Cùng lỗi đó với "Input" trước "Input Format": phần thân từng bắt đầu bằng " Format".
assert.equal(parsed.inputFormat, "First line contains n and target.");
assert.equal(parsed.outputFormat, "Two indices.");
assert.equal(parsed.examples, "2 7 11 15, 9 => 0 1");

// Tên mục tiếng Việt vẫn nhận, và đề không có mục nào thì cả bài là phần mô tả.
const vietnamese = parseProblemText(`Đếm số chẵn
Đề bài
Cho mảng n số nguyên.
Ràng buộc
1 <= n <= 100`);
assert.equal(vietnamese.statement, "Cho mảng n số nguyên.");
assert.deepEqual(splitLines(vietnamese.constraints), ["1 <= n <= 100"]);

const plain = parseProblemText("Chỉ có mỗi một dòng đề bài.");
assert.equal(plain.statement, "Chỉ có mỗi một dòng đề bài.");
assert.equal(plain.constraints, "");

console.log("exercise-authoring: OK");
