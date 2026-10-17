/** Self-check cho dữ liệu landing. Chạy: `pnpm test landing`. */
import assert from "node:assert/strict";
import type { CourseSummary, RoadmapSummary } from "@/types/catalogue";
import { roadmapsByLevel, topicCategories, topicRails } from "./data";

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

const rails = topicRails([
  course("a", [topic("js", "web"), topic("react", "web"), topic("sql", "database"), topic("py", "data_ai")]),
  course("b", [topic("js", "web"), topic("arr", "algorithms"), topic("tree", "algorithms"), topic("q", "algorithms"), topic("sort", "algorithms")]),
]);
// Hai dải; JS (2 khóa) đứng đầu; mỗi chủ đề link tới đúng bộ lọc của nó.
assert.equal(rails.length, 2);
assert.deepEqual(rails[0][0], { id: "js", slug: "js", category: "web", name: "JS", courseCount: 2, href: "/courses?topics=js" });
assert.equal(rails[1].length, 4);
// Thuật toán quá ít thì gộp một dải, không để một dải lèo tèo.
assert.equal(topicRails([course("a", [topic("js", "web"), topic("arr", "algorithms")])]).length, 1);
assert.deepEqual(topicRails([]), []);

console.log("landing data: ok");
