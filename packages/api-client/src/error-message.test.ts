/** Self-check: lỗi API không bao giờ hiện "Request failed with status …" cho người dùng. */
import assert from "node:assert/strict";
import { ApiClientError, createApiClient } from "./index";

async function failWith(status: number, body: unknown) {
  const request = createApiClient({
    baseUrl: "http://x",
    fetchImplementation: async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  });
  try {
    await request("/y");
  } catch (error) {
    assert.ok(error instanceof ApiClientError);
    return error;
  }
  throw new Error("expected a failure");
}

assert.equal((await failWith(404, { message: "Không tìm thấy nhóm học tập" })).message, "Không tìm thấy nhóm học tập");
assert.equal((await failWith(400, { message: ["a", "b"] })).message, "a. b");
const bare = await failWith(404, {});
assert.equal(bare.message, "Không tìm thấy nội dung yêu cầu.");
assert.equal(bare.status, 404);
assert.equal((await failWith(502, undefined)).message, "Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.");
console.log("ok");
