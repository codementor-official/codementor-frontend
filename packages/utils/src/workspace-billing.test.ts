import assert from "node:assert/strict";
import { annualSaving, formatBytes, formatLimit, fromBytes, toBytes, usagePercent } from "./workspace-billing";

const MB = 1024 ** 2;

assert.equal(formatBytes(100 * MB), "100 MB");
assert.equal(formatBytes(1.5 * 1024 * MB), "1,5 GB");
assert.equal(formatBytes(2 * 1024 * MB), "2 GB");
assert.equal(formatBytes(-5), "0 B");

assert.equal(formatLimit(null), "Không giới hạn");
assert.equal(formatLimit(50), "50");

assert.equal(usagePercent(32, 50), 64);
assert.equal(usagePercent(80, 50), 100);
assert.equal(usagePercent(1000, null), 0);
assert.equal(usagePercent(0, 0), 0);
assert.equal(usagePercent(1, 0), 100);

assert.deepEqual(annualSaving(99_000, 990_000), { perMonth: 82_500, percent: 17 });
assert.equal(annualSaving(99_000, null), null);
assert.equal(annualSaving(0, 990_000), null);

assert.equal(toBytes(2, "GB"), 2 * 1024 * MB);
assert.deepEqual(fromBytes(2 * 1024 * MB), { value: 2, unit: "GB" });
assert.deepEqual(fromBytes(100 * MB), { value: 100, unit: "MB" });
assert.deepEqual(fromBytes(toBytes(1.5, "GB")), { value: 1.5, unit: "GB" });
