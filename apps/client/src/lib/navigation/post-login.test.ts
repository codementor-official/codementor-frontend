/**
 * Self-check for the post-login destination. Run with `pnpm test` from the repo root.
 */
import assert from "node:assert/strict";
import { postLoginTarget, safeNextPath } from "./post-login";

const homes = {
  lecturerAppUrl: "https://lecturer.codementor.cloud",
  adminAppUrl: "https://admin.codementor.cloud/",
};

// Learners land on their dashboard, not on the practice list as before.
assert.deepEqual(postLoginTarget("learner", null, homes), { kind: "internal", href: "/dashboard" });

// Lecturers and admins go to the dashboard of their own app.
assert.deepEqual(postLoginTarget("lecturer", null, homes), {
  kind: "external",
  href: "https://lecturer.codementor.cloud/dashboard",
});
assert.deepEqual(postLoginTarget("admin", null, homes), {
  kind: "external",
  href: "https://admin.codementor.cloud/dashboard",
});

// Without a configured app every role stays on the Client dashboard.
assert.deepEqual(postLoginTarget("lecturer", null, {}), { kind: "internal", href: "/dashboard" });
assert.deepEqual(postLoginTarget("admin", null, { adminAppUrl: "javascript:alert(1)" }), {
  kind: "internal",
  href: "/dashboard",
});

// A page the user was blocked from wins over the role default, for every role.
assert.deepEqual(postLoginTarget("lecturer", "/courses/abc?tab=1", homes), {
  kind: "internal",
  href: "/courses/abc?tab=1",
});

// Open-redirect and loop guards.
assert.equal(safeNextPath("//evil.com"), null);
assert.equal(safeNextPath("/\\evil.com"), null);
assert.equal(safeNextPath("https://evil.com"), null);
assert.equal(safeNextPath("/login?next=/x"), null);
assert.equal(safeNextPath("/auth/callback"), null);
assert.equal(safeNextPath("/practice"), "/practice");

console.log("post-login: ok");
