/**
 * Self-check for the custom report range rule. Run with `pnpm test revenue-period`.
 */
import assert from "node:assert/strict";
import { rangeError } from "./revenue-period-picker";

assert.equal(rangeError({ from: "2026-07-17", to: "2026-10-14" }), null);
assert.equal(rangeError({ from: "2026-10-14", to: "2026-10-14" }), null); // one day, both ends count
assert.match(rangeError({ from: "2026-10-10", to: "2026-10-01" }) ?? "", /từ ngày bắt đầu/);
assert.match(rangeError({ from: "", to: "2026-10-01" }) ?? "", /đầy đủ/);
assert.match(rangeError({ from: "2026-02-30", to: "2026-03-01" }) ?? "", /đầy đủ/); // not a real day
assert.equal(rangeError({ from: "2025-10-14", to: "2026-10-14" }), null); // 366 days
assert.match(rangeError({ from: "2025-10-13", to: "2026-10-14" }) ?? "", /366/);

console.log("revenue-period: ok");
