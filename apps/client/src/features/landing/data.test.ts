/** Self-check cho dữ liệu landing. Chạy: `pnpm test landing`. */
import assert from "node:assert/strict";
import type { CourseSummary, RoadmapSummary } from "@/types/catalogue";
import { roadmapsByLevel, topicCategories } from "./data";

const topic = (id: string, category: string) => ({ id, slug: id, name: id.toUpperCase(), category });
const course = (id: string, topics: ReturnType<typeof topic>[]) => ({ id, topics }) as unknown as CourseSummary;

const categories = topicCategories([
  course("a", [topic("go", "foundations"), topic("loop", "algorithms")]),
  course("b", [topic("go", "foundations"), topic("x", "unknown")]),
  course("c", [topic("sort", "algorithms")]),
  course("d", []),
]);
// Thứ tự theo bảng nhãn, bỏ category lạ, đếm khóa không trùng, gom id chủ đề cho link lọc.
assert.deepEqual(categories.map((c) => [c.key, c.courseCount]), [["foundations", 2], ["algorithms", 2]]);
assert.equal(categories[1].href, "/courses?topics=loop,sort");
assert.deepEqual(categories[0].topics, ["GO"]);

const stages = roadmapsByLevel([
  { id: "1", level: "intermediate" },
  { id: "2", level: "none" },
  { id: "3", level: "mystery" },
] as RoadmapSummary[]);
assert.deepEqual(stages.map((s) => s.level), ["none", "intermediate"]);

console.log("landing data: ok");
