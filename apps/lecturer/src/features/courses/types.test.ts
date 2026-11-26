import assert from "node:assert/strict";
import { assignIds, keepKeys, mergeSaved, rememberIds, toDraft, type DraftChapter, type StoredChapter } from "./types";

const lesson = (key: string, id?: string) => ({ key, id }) as DraftChapter["lessons"][number];
const chapter = (key: string, id: string | undefined, lessons: DraftChapter["lessons"]) =>
  ({ key, id, lessons }) as DraftChapter;
const stored = (id: string, lessonIds: string[]) =>
  ({ id, lessons: lessonIds.map((lessonId) => ({ id: lessonId })) }) as StoredChapter;

// Lưu lần đầu: hàng mới được cấp id nhưng PHẢI giữ khoá, nếu không panel đang mở bị remount
// và mất chữ đang gõ cùng video đang tải.
const before = [chapter("c1", "c1", [lesson("l1", "l1"), lesson("tmp-bai")]), chapter("tmp-chuong", undefined, [lesson("tmp-2")])];
const after = keepKeys(before, toDraft([stored("c1", ["l1", "l2"]), stored("c2", ["l3"])]));
assert.deepEqual(after.map((c) => [c.key, c.id]), [["c1", "c1"], ["tmp-chuong", "c2"]]);
assert.deepEqual(after[0].lessons.map((l) => [l.key, l.id]), [["l1", "l1"], ["tmp-bai", "l2"]]);
assert.deepEqual(after[1].lessons.map((l) => [l.key, l.id]), [["tmp-2", "l3"]]);

// Lưu lần sau: khoá tạm vẫn sống, dù hàng đã có id.
assert.deepEqual(keepKeys(after, toDraft([stored("c1", ["l1", "l2"]), stored("c2", ["l3"])])), after);

// Lần tải đầu, và hàng khác id ở cùng vị trí: lấy khoá của bản mới.
assert.equal(keepKeys([], toDraft([stored("c1", ["l1"])]))[0].key, "c1");
assert.equal(keepKeys([chapter("cu", "khac", [])], toDraft([stored("c1", [])]))[0].key, "c1");

// Lưu xong mà cây không đổi trong lúc chờ: lấy bản máy chủ, giữ khoá.
const sent = [chapter("tmp-c", undefined, [lesson("tmp-a")])];
const saved = toDraft([stored("c9", ["l9"])]);
const ids = new Map<string, string>();
rememberIds(ids, sent, saved);
assert.deepEqual([...ids], [["tmp-c", "c9"], ["tmp-a", "l9"]]);
assert.deepEqual(mergeSaved(sent, sent, saved, ids).map((c) => [c.key, c.id]), [["tmp-c", "c9"]]);

// Cây đổi trong lúc chờ (sửa tên, thêm bài, thêm chương): giữ bản đang soạn, chỉ nhận id.
const edited = [
  chapter("tmp-c", undefined, [{ ...lesson("tmp-a"), title: "đổi tên" }, lesson("tmp-moi")]),
  chapter("tmp-c2", undefined, []),
];
const merged = mergeSaved(sent, edited, saved, ids);
assert.deepEqual(merged[0].lessons.map((l) => [l.key, l.id, l.title]), [["tmp-a", "l9", "đổi tên"], ["tmp-moi", undefined, undefined]]);
assert.deepEqual([merged[0].id, merged[1].id], ["c9", undefined]);
// Bài xoá trong lúc chờ thì vẫn xoá.
assert.deepEqual(mergeSaved(sent, [chapter("tmp-c", undefined, [])], saved, ids)[0].lessons, []);
// Hàng đã có id không bị đè; gửi lại ngay sau đó mang đủ id nên không tạo trùng.
assert.equal(assignIds([chapter("tmp-c", "khac", [])], ids)[0].id, "khac");
assert.equal(assignIds(sent, ids)[0].lessons[0].id, "l9");

console.log("ok");
