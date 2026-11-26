import assert from "node:assert/strict";
import { keepKeys, toDraft, type DraftChapter, type StoredChapter } from "./types";

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

console.log("ok");
