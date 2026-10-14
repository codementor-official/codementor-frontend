/**
 * Self-check for table CSV cells. Run with `pnpm test export-csv`.
 */
import assert from "node:assert/strict";
import { exportCell } from "./export-csv";

assert.equal(exportCell("published"), "Đã công khai");
assert.equal(exportCell("basic"), "Cơ bản");
assert.equal(exportCell("easy"), "Cơ bản");
assert.equal(exportCell("frontend"), "Frontend");
assert.equal(exportCell("2026-10-09T12:59:20.074Z"), "2026-10-09 19:59");
assert.equal(exportCell(7), 7);
assert.equal(exportCell(null), "");
assert.equal(exportCell("Go cơ bản"), "Go cơ bản");
// A plain date (no time) is left alone — only full ISO timestamps are converted.
assert.equal(exportCell("2026-10-09"), "2026-10-09");

console.log("export-csv: ok");
