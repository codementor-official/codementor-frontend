/**
 * Self-check cho danh sách khóa học của lộ trình. Repo chưa có test runner, chạy thẳng:
 *
 *   pnpm --filter @codementor/lecturer exec tsx src/features/lecter/roadmap-payload.test.ts
 *
 * Ca quan trọng nhất là `id tự đặt bị chặn`: khác cây chương trình, lộ trình KHÔNG có khái niệm
 * "mục mới id null", nên mọi thứ không phải uuid đều là model tự bịa ra một khóa học.
 */
import assert from "node:assert/strict";
import {
  MAX_ROADMAP_COURSES,
  assertRealCourseIds,
  roadmapCourseArgSchema,
  roadmapCourseSchema,
  toRoadmapCoursesPayload,
} from "./roadmap-payload";

const C1 = "828844ca-723f-4c1c-a75e-f3cb0eb5aca7";
const C2 = "4da86bae-efe8-4a60-b96e-ee5dc29f81b3";

// --- schema ---------------------------------------------------------------

assert.equal(roadmapCourseSchema.safeParse({ courseId: C1 }).success, true);
assert.equal(
  roadmapCourseSchema.safeParse({ courseId: C1, isOptional: true }).success,
  true,
);
assert.equal(roadmapCourseSchema.safeParse({ isOptional: true }).success, false);
assert.equal(
  roadmapCourseSchema.safeParse({ courseId: C1, isOptional: "true" }).success,
  false,
);

// --- payload --------------------------------------------------------------

assert.deepEqual(
  toRoadmapCoursesPayload([{ courseId: C1 }, { courseId: C2, isOptional: true }]),
  [
    { courseId: C1, isOptional: false },
    { courseId: C2, isOptional: true },
  ],
  "isOptional vắng mặt phải thành false tường minh, và thứ tự phải giữ nguyên",
);

// Thứ tự mảng LÀ thứ tự học; đảo hai phần tử phải ra một payload khác.
assert.deepEqual(
  toRoadmapCoursesPayload([{ courseId: C2 }, { courseId: C1 }]).map((c) => c.courseId),
  [C2, C1],
);

assert.deepEqual(toRoadmapCoursesPayload([]), []);

// `title` chỉ để hiện lên thẻ; gửi nó đi lưu là trường thừa và backend từ chối cả lệnh ghi.
assert.deepEqual(
  toRoadmapCoursesPayload([{ courseId: C1, title: "Java cơ bản" } as never]),
  [{ courseId: C1, isOptional: false }],
);
assert.equal(
  roadmapCourseArgSchema.safeParse({ courseId: C1, title: "Java cơ bản" }).success,
  true,
);
assert.equal(roadmapCourseArgSchema.safeParse({ courseId: C1 }).success, false);

// --- hàng rào id ----------------------------------------------------------

// Chỉ MAP thì không được ném: hàm này còn chạy trên đường kiểm, nơi ngoại lệ bị nuốt và nút vẫn
// bấm được. Phần chặn nằm ở `assertRealCourseIds`, gọi trên đường ghi.
assert.doesNotThrow(() => toRoadmapCoursesPayload([{ courseId: "course-2" }]));

// Id tự đặt: Nest cũng chặn, nhưng câu của nó không nói phải làm gì.
assert.throws(
  () => assertRealCourseIds([{ courseId: C1 }, { courseId: "course-2" }]),
  (error: Error) => {
    assert.match(error.message, /khóa 2 = "course-2"/);
    assert.match(error.message, /search_courses/);
    return true;
  },
);

// Chuỗi rỗng là cách model diễn đạt "chưa biết id" — vẫn phải nổ, không lọt xuống Nest.
assert.throws(() => assertRealCourseIds([{ courseId: "" }]));
assert.doesNotThrow(() => assertRealCourseIds([{ courseId: C1 }, { courseId: C2 }]));
assert.equal(MAX_ROADMAP_COURSES, 200);

console.log("roadmap-payload: OK");
