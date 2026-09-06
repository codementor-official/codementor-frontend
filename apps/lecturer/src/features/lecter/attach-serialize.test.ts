/**
 * Self-check cho phần ghép đính kèm vào tin nhắn. Repo chưa có test runner, chạy thẳng:
 *
 *   npx tsx apps/lecturer/src/features/lecter/attach-serialize.test.ts
 *
 * Ca quan trọng nhất: tệp tải HỎNG không được đi vào tin nhắn. Id của nó là mã tạm do trình
 * duyệt sinh, chưa từng có bản ghi nào phía sau, nên Lecter sẽ báo "không tìm thấy" cho một tệp
 * người soạn đang nhìn thấy trên màn hình.
 */
import assert from "node:assert/strict";
import { ATTACH_LABELS, MAX_ATTACHMENTS, type AttachedItem } from "./use-attached-content";

/** Bản sao thuần của thân `serialize`, để chạy được ngoài React. */
function serialize(items: AttachedItem[]): string {
  const usable = items.filter((item) => item.state !== "failed");
  if (usable.length === 0) return "";
  return (
    "\n\n" +
    usable
      .map((item) => `[Đính kèm] ${ATTACH_LABELS[item.kind]} "${item.title}" · id ${item.id}`)
      .join("\n")
  );
}

const exercise: AttachedItem = { kind: "exercise", id: "ex-1", title: "Two Sum" };
const ready: AttachedItem = {
  kind: "document",
  id: "doc-1",
  title: "Đề cương.pdf",
  state: "ready",
};
const failed: AttachedItem = {
  kind: "document",
  id: "upload:tmp",
  title: "Hỏng.pdf",
  state: "failed",
};

assert.equal(serialize([]), "");
assert.equal(
  serialize([exercise]),
  '\n\n[Đính kèm] Bài code "Two Sum" · id ex-1',
);
assert.match(serialize([ready]), /\[Đính kèm\] Tài liệu "Đề cương\.pdf" · id doc-1/);

// Tệp hỏng bị loại; tệp bên cạnh vẫn đi.
const mixed = serialize([exercise, failed, ready]);
assert.ok(!mixed.includes("upload:tmp"), "id tạm của tệp hỏng lọt vào tin nhắn");
assert.ok(!mixed.includes("Hỏng.pdf"));
assert.ok(mixed.includes("ex-1") && mixed.includes("doc-1"));

// Chỉ còn tệp hỏng thì không ghép gì cả, không để lại hai dòng trống.
assert.equal(serialize([failed]), "");

// Trần phải khớp với `ai_document_max_files` phía backend.
assert.equal(MAX_ATTACHMENTS, 4);

console.log("attach-serialize: OK");
