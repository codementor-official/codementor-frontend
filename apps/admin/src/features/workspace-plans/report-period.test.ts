/**
 * Self-check for the report period presets. Run with `pnpm test report-period`.
 */
import assert from "node:assert/strict";
import { presetRange, vietnamToday } from "./report-period";

assert.deepEqual(presetRange("this-month", "2026-02-10"), { from: "2026-02-01", to: "2026-02-28" });
assert.deepEqual(presetRange("last-month", "2026-01-15"), { from: "2025-12-01", to: "2025-12-31" });
assert.deepEqual(presetRange("this-quarter", "2026-11-06"), { from: "2026-10-01", to: "2026-12-31" });
assert.deepEqual(presetRange("last-quarter", "2026-02-01"), { from: "2025-10-01", to: "2025-12-31" });
assert.deepEqual(presetRange("this-year", "2026-11-06"), { from: "2026-01-01", to: "2026-12-31" });
assert.deepEqual(presetRange("last-year", "2026-11-06"), { from: "2025-01-01", to: "2025-12-31" });
assert.equal(vietnamToday(new Date("2026-10-31T18:30:00Z")), "2026-11-01"); // 01:30 in Vietnam
console.log("report-period: ok");
