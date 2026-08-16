/**
 * Self-check for the breadcrumb derivation. No test runner in this repository yet, so this
 * is runnable directly:
 *
 *   pnpm --filter @codementor/client exec tsx src/lib/navigation/route-meta.test.ts
 *
 * Move it to whatever runner lands first; the assertions carry over unchanged.
 */
import assert from "node:assert/strict";
import { breadcrumbFor } from "./route-meta";

const trail = (pathname: string, titles?: Record<string, string>) =>
  breadcrumbFor(pathname, titles).map((item) => `${item.label}${item.href ? `→${item.href}` : ""}`);

// Top-level page: itself only, unlinked.
assert.deepEqual(trail("/dashboard"), ["Tổng quan"]);

// A second-level page chains back to the dashboard.
assert.deepEqual(trail("/paths"), ["Tổng quan→/dashboard", "Lộ trình"]);

// Dynamic segment with no registered title falls back to a readable slug.
assert.deepEqual(trail("/paths/frontend-developer"), [
  "Tổng quan→/dashboard",
  "Lộ trình→/paths",
  "Frontend developer",
]);

// ...and uses the real title once the page registers it.
assert.deepEqual(trail("/paths/frontend-developer", { "frontend-developer": "Frontend Developer" }), [
  "Tổng quan→/dashboard",
  "Lộ trình→/paths",
  "Frontend Developer",
]);

// "courses" is a collection segment, not a place — it gets no crumb of its own.
assert.deepEqual(
  trail("/paths/frontend-developer/courses/html-co-ban", {
    "frontend-developer": "Frontend Developer",
    "html-co-ban": "HTML cơ bản",
  }),
  [
    "Tổng quan→/dashboard",
    "Lộ trình→/paths",
    "Frontend Developer→/paths/frontend-developer",
    "HTML cơ bản",
  ],
);

// Deep nesting keeps every ancestor reachable.
assert.deepEqual(trail("/workspace/nhom-1"), [
  "Tổng quan→/dashboard",
  "Nhóm học tập→/workspace",
  "Nhom 1",
]);

// An unregistered root yields nothing rather than a plausible-looking wrong trail.
assert.deepEqual(trail("/not-a-route"), []);
assert.deepEqual(trail("/"), []);

console.log("route-meta: all assertions passed");
