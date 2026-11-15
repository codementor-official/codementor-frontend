import assert from "node:assert/strict";
import { trackContentWrite } from "./edited-since-review";

const store = new Map<string, string>();
Object.assign(globalThis, {
  window: { dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} },
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
  Event: class { constructor(public type: string) {} },
});
const marked = () => JSON.parse(store.get("cm:edited-since-review") ?? "{}") as Record<string, true>;
const id = "3f1c2a9e-1b2c-4d5e-8f90-123456789abc";

trackContentWrite("GET", `/courses/${id}`);
trackContentWrite("POST", `/courses/${id}/cover-upload-url`);
trackContentWrite("POST", `/courses/${id}/request-removal`);
assert.deepEqual(marked(), {}, "reads, upload URLs and state moves are not edits");

trackContentWrite("PUT", `/courses/${id}/curriculum`);
trackContentWrite("PUT", `/articles/${id}/content`);
assert.deepEqual(marked(), { [`courses:${id}`]: true, [`articles:${id}`]: true }, "saves mark the item");

trackContentWrite("POST", `/courses/${id}/submit`);
assert.deepEqual(marked(), { [`articles:${id}`]: true }, "sending for review clears it");

trackContentWrite("PATCH", "/exercises/" + id);
assert.deepEqual(Object.keys(marked()), [`articles:${id}`], "other resources are ignored");
console.log("edited-since-review: ok");
