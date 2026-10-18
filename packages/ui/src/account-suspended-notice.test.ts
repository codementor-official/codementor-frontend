/** Self-check cho đồng hồ đếm ngược mở khoá. Chạy: `pnpm test suspended`. */
import assert from "node:assert/strict";
import { formatSuspensionLeft } from "./account-suspended-notice";

assert.equal(formatSuspensionLeft(24 * 3600 * 1000), "1 ngày 00:00:00");
assert.equal(formatSuspensionLeft((2 * 3600 + 3 * 60 + 4) * 1000), "02:03:04");
assert.equal(formatSuspensionLeft(-5000), "00:00:00");
assert.equal(formatSuspensionLeft(999), "00:00:00");
console.log("suspended notice: ok");
