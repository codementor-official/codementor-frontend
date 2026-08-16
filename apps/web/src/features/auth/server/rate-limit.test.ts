/**
 * Self-check for the login rate limiter. No test runner in this repository yet, so this
 * is runnable directly:
 *
 *   pnpm --filter @codementor/web exec tsx src/features/auth/server/rate-limit.test.ts
 *
 * Move it to whatever runner lands first; the assertions carry over unchanged.
 */
import assert from "node:assert/strict";
import { allowLoginAttempt, resetLoginAttempts } from "./rate-limit";

const start = 1_700_000_000_000;

// Ten attempts pass, the eleventh in the same window does not.
resetLoginAttempts();
for (let attempt = 1; attempt <= 10; attempt += 1) {
  assert.equal(allowLoginAttempt("1.2.3.4", start + attempt), true, `attempt ${attempt}`);
}
assert.equal(allowLoginAttempt("1.2.3.4", start + 11), false);

// Rejected attempts keep counting: hammering faster than the window must not reset it.
assert.equal(allowLoginAttempt("1.2.3.4", start + 12), false);

// The window slides — an hour later the same address starts over.
assert.equal(allowLoginAttempt("1.2.3.4", start + 3_600_000), true);

// One address running out of attempts must not lock out anybody else.
resetLoginAttempts();
for (let attempt = 1; attempt <= 11; attempt += 1) allowLoginAttempt("1.2.3.4", start + attempt);
assert.equal(allowLoginAttempt("5.6.7.8", start + 12), true);

// Requests without a forwarded address share one bucket rather than bypassing the limit.
resetLoginAttempts();
for (let attempt = 1; attempt <= 10; attempt += 1) allowLoginAttempt("unknown", start + attempt);
assert.equal(allowLoginAttempt("unknown", start + 11), false);

console.log("rate-limit self-check passed");
