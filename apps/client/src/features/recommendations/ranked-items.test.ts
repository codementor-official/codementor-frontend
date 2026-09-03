import assert from "node:assert/strict";
import { inRecommendationOrder } from "./ranked-items";

const ranked = [
  { id: "outside-first-page", score: 99 },
  { id: "published", score: 80 },
  { id: "unpublished-since-ranking", score: 75 },
];
const records = [
  { id: "unrelated", title: "Not recommended" },
  { id: "published", title: "Public course" },
  { id: "outside-first-page", title: "Exact ID hydration" },
];
const original = structuredClone(records);
const result = inRecommendationOrder(ranked, records);
assert.deepEqual(result.map(({ item }) => item.id), ["outside-first-page", "published"]);
assert.equal(result[0].recommendation.score, 99);
assert.deepEqual(records, original, "hydration must not mutate catalogue data");
assert.deepEqual(inRecommendationOrder(ranked, []), []);
assert.deepEqual(inRecommendationOrder([], records), []);
assert.ok(!result.some(({ item }) => item.id === "unpublished-since-ranking"),
  "do not restore unavailable records from stale recommendation metadata");
assert.ok(!result.some(({ item }) => item.id === "unrelated"),
  "do not fill gaps with unrelated catalogue entries");
console.log("Recommendation hydration checks passed.");
