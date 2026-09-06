/**
 * Self-check cho cây chương trình. Repo chưa có test runner, chạy thẳng:
 *
 *   pnpm --filter @codementor/lecturer exec tsx src/features/lecter/curriculum-payload.test.ts
 *
 * Ca gốc là hội thoại thật `lecter:1e7f78d7-…`: model gọi `validate_curriculum` với `id: null`
 * (được duyệt) rồi gọi `save_curriculum` với `id: "new-1"` và ăn 400 từ Nest — vì hai tool khai
 * hai kiểu khác nhau cho cùng một trường.
 */
import assert from "node:assert/strict";
import {
  chapterSchema,
  lessonContentSchema,
  toCurriculumPayload,
  toLessonContentPayload,
  type LessonContentInput,
} from "./curriculum-payload";

const CH = "828844ca-723f-4c1c-a75e-f3cb0eb5aca7";
const LS = "4da86bae-efe8-4a60-b96e-ee5dc29f81b3";
const EX = "17804ea6-f26c-4be6-a01b-95b566ce67d6";

// 1. `null` là cách hợp lệ để nói "mục mới" — thứ mà `.optional()` từng từ chối.
assert.equal(chapterSchema.safeParse({ id: null, title: "Hàm", lessons: [] }).success, true);
assert.equal(
  chapterSchema.safeParse({ title: "Hàm", lessons: [{ id: null, title: "A", type: "article" }] })
    .success,
  true,
);

// 2. Id tự đặt bị chặn ngay ở schema, nên model không thể gửi nó cho `save_curriculum`.
assert.equal(chapterSchema.safeParse({ id: "new-chapter-1", title: "X", lessons: [] }).success, false);
assert.equal(
  chapterSchema.safeParse({ title: "X", lessons: [{ id: "new-1", title: "A", type: "article" }] })
    .success,
  false,
);

// 3. Payload gửi đi: mục cũ giữ id, mục mới KHÔNG có khoá `id` (Nest 400 với cả "" lẫn null).
const payload = toCurriculumPayload([
  {
    id: CH,
    title: "Làm quen",
    lessons: [
      { id: LS, title: "Bài cũ", type: "article" },
      { id: null, title: "Bài mới", type: "exercise", exerciseId: EX },
      { title: "Bài mới nữa", type: "article" },
    ],
  },
  { title: "Chương mới", lessons: [] },
]);

assert.equal(payload[0]!.id, CH);
assert.equal(payload[0]!.lessons[0]!.id, LS);
assert.ok(!("id" in payload[0]!.lessons[1]!), "bài mới không được mang khoá id");
assert.ok(!("id" in payload[0]!.lessons[2]!), "bài thiếu id cũng không được mang khoá id");
assert.ok(!("id" in payload[1]!), "chương mới không được mang khoá id");
assert.equal(payload[0]!.lessons[1]!.exerciseId, EX);
assert.equal(payload[0]!.lessons[0]!.exerciseId, null);

// 4. Hàng rào cuối: id giả lọt qua schema thì câu lỗi phải nêu CÁCH SỬA, không chỉ nêu luật.
assert.throws(
  () =>
    toCurriculumPayload([
      { id: "new-chapter-1", title: "X", lessons: [] },
    ] as unknown as Parameters<typeof toCurriculumPayload>[0]),
  (error: Error) => error.message.includes("id: null") && error.message.includes("new-chapter-1"),
);

console.log("curriculum-payload: tất cả assert đều qua");

// --- Nội dung bài học ------------------------------------------------------
// Ca gốc: hội thoại `lecter:e1ca6d40-…`. Bài `article` không có video, model vẫn gửi
// `media: {url: "", durationSeconds: 0, captionsUrl: ""}`. `LessonMediaDto.url` không có
// @IsOptional() và bị @IsUrl(require_protocol) gác → PUT trả 400, hai lượt liền.

const EMPTY_MEDIA = {
  summary: "Giới thiệu Go",
  objectives: ["Hiểu Go là gì", "  ", ""],
  contentHtml: "<p>Go là…</p>",
  exerciseBrief: [],
  media: { url: "", durationSeconds: 0, captionsUrl: "" },
};

// Schema chặn ngay: `url` rỗng không phải URL.
assert.equal(lessonContentSchema.safeParse(EMPTY_MEDIA).success, false);

// Và nếu vẫn lọt tới đây thì normalizer bỏ hẳn `media` + mọi trường rỗng.
const content = toLessonContentPayload(EMPTY_MEDIA as unknown as LessonContentInput);
assert.ok(!("media" in content), "media không có url thì phải bị bỏ");
assert.ok(!("exerciseBrief" in content), "mảng rỗng phải bị bỏ");
assert.deepEqual(content.objectives, ["Hiểu Go là gì"], "phần tử rỗng bị lọc");
assert.equal(content.summary, "Giới thiệu Go");

// Bài video có link thật thì giữ nguyên, kể cả durationSeconds = 0.
const video = toLessonContentPayload({
  summary: "   ",
  media: { url: "https://cdn.example.com/go.mp4", durationSeconds: 0, captionsUrl: "" },
});
assert.ok(!("summary" in video), "chuỗi toàn khoảng trắng bị bỏ");
assert.deepEqual(video.media, { url: "https://cdn.example.com/go.mp4", durationSeconds: 0 });

// URL thiếu giao thức bị chặn — Nest bật require_protocol.
assert.equal(
  lessonContentSchema.safeParse({ media: { url: "cdn.example.com/go.mp4" } }).success,
  false,
);

console.log("lesson-content: tất cả assert đều qua");
