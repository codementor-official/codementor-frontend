/**
 * Self-check cho luật tách câu trả lời đang chảy. Repo chưa có test runner, chạy thẳng:
 *
 *   npx tsx apps/client/src/features/ai-tutor/answer-format.test.ts
 *
 * Cùng các ca với `tests/test_tutor.py` ở ai-service — hai bản tách phải đồng ý với nhau, nếu
 * không thì chữ nhảy khối ngay lúc stream xong.
 */
import assert from "node:assert/strict";
import { EXPLAIN, QUOTES, splitAnswer } from "./answer-format";

// Sai định dạng: tất cả là phần giải thích, không bao giờ thành trích dẫn.
assert.deepEqual(splitAnswer("> LIFO [S1]\nStack là LIFO."), {
  quotes: [],
  explanation: "> LIFO [S1]\nStack là LIFO.",
});

// Trích dẫn nhiều dòng, bọc nháy; khối không có mã vẫn hiện (đang viết dở).
assert.deepEqual(
  splitAnswer(`${QUOTES}\n> "Stack dùng\n> LIFO." [S1]\n\n> Queue dùng FIFO. [S2]\n\n> đang viết${EXPLAIN}\nGiải thích.`),
  {
    quotes: [
      { sourceId: "S1", quote: "Stack dùng LIFO." },
      { sourceId: "S2", quote: "Queue dùng FIFO." },
      { sourceId: null, quote: "đang viết" },
    ],
    explanation: "Giải thích.",
  },
);

// Dấu mốc đang chảy dở không lộ ra màn hình.
assert.deepEqual(splitAnswer(`${QUOTES}\n> LIFO [S1]\n<<<GIA`), {
  quotes: [{ sourceId: "S1", quote: "LIFO" }],
  explanation: "",
});

// Chưa tới phần giải thích.
assert.equal(splitAnswer(`${QUOTES}\n`).explanation, "");

console.log("answer-format: ok");
