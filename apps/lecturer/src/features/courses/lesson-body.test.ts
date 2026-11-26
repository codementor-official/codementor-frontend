import assert from "node:assert/strict";
import { bodyProblem, patchBody, toBody, toContent, unsavedLessons, type BodyDraft } from "./lesson-body";
import type { DraftChapter, DraftLesson } from "./types";

const draft = (partial: Partial<BodyDraft> = {}): BodyDraft => ({ html: "", summary: "", videoUrl: "", videoSeconds: null, dirty: true, ...partial });
const lesson = (key: string, type: DraftLesson["type"] = "article") => ({ key, type, durationMinutes: "10" }) as DraftLesson;

// Đọc từ máy chủ, và ghi lại đúng phần của từng kiểu bài.
assert.deepEqual(toBody(null), { html: "", summary: "", videoUrl: "", videoSeconds: null });
assert.deepEqual(toBody({ contentHtml: "<p>a</p>", summary: "s", media: { url: "u", durationSeconds: 9 } }), { html: "<p>a</p>", summary: "s", videoUrl: "u", videoSeconds: 9 });
assert.deepEqual(toContent("article", draft({ html: "<p>a</p>", videoUrl: "u" })), { summary: undefined, contentHtml: "<p>a</p>" });
assert.deepEqual(toContent("video", draft({ html: "<p>a</p>", summary: "s", videoUrl: " u ", videoSeconds: 9.4 })), { summary: "s", media: { url: "u", durationSeconds: 9 } });
assert.deepEqual(toContent("video", draft()), { summary: undefined });

// Sửa thì bẩn; đo thời lượng khi chỉ mở xem thì không; không đổi gì thì giữ nguyên object.
const loaded = { a: draft({ html: "x", dirty: false }) };
assert.equal(patchBody(loaded, "a", { html: "x" }), loaded);
assert.equal(patchBody(loaded, "a", { videoSeconds: 5 }, false).a.dirty, false);
assert.equal(patchBody(loaded, "a", { html: "y" }).a.dirty, true);
assert.deepEqual(patchBody({}, "b", { summary: "s" }).b, draft({ summary: "s" }));
assert.equal(patchBody({ a: draft() }, "a", { videoSeconds: 5 }, false).a.dirty, true);

// Chỉ bài còn trên cây, còn mang thân bài và đã sửa mới cần ghi.
const chapters = [{ lessons: [lesson("sach"), lesson("ban")] }, { lessons: [lesson("code", "exercise"), lesson("video", "video")] }] as DraftChapter[];
const pending = unsavedLessons(chapters, { sach: draft({ dirty: false }), ban: draft(), code: draft(), video: draft(), daXoa: draft() });
assert.deepEqual(pending.map((p) => [p.chapterIndex, p.lessonIndex, p.lesson.key]), [[0, 1, "ban"], [1, 1, "video"]]);

assert.equal(bodyProblem(lesson("a"), draft()), undefined);
assert.match(bodyProblem(lesson("a"), draft({ summary: "x".repeat(2001) })) ?? "", /2000/);
assert.ok(bodyProblem(lesson("v", "video"), draft({ videoUrl: "khong-phai-url" })));

console.log("ok");
