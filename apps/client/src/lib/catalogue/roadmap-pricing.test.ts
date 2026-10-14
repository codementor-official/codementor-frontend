/**
 * Self-check for the roadmap tuition fallback. Run with `pnpm test` from the repo root.
 */
import assert from "node:assert/strict";
import { summarizeRoadmapPricing } from "./roadmap-pricing";

assert.deepEqual(
  summarizeRoadmapPricing([
    { priceVnd: 1_799_000, listPriceVnd: 1_999_000 },
    { priceVnd: 0, listPriceVnd: 0 },
    {},
  ]),
  { totalVnd: 1_799_000, listTotalVnd: 1_999_000, paidCourses: 1, freeCourses: 2 },
);
// A course without a list price counts its current price, never zero, in the list total.
assert.equal(summarizeRoadmapPricing([{ priceVnd: 500_000 }]).listTotalVnd, 500_000);
assert.deepEqual(summarizeRoadmapPricing([]), { totalVnd: 0, listTotalVnd: 0, paidCourses: 0, freeCourses: 0 });

console.log("roadmap-pricing: ok");
