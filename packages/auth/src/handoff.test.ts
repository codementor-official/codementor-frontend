/** Self-check cho gói chuyển phiên admin → client. Chạy: `pnpm test handoff`. */
import assert from "node:assert/strict";
import { EncryptJWT } from "jose";
import { openHandoff, safeHandoffPath, sealHandoff } from "./handoff";

(async () => {
  const token = await sealHandoff({ refreshToken: "rt-1", path: "/articles/abc" }, "secret");
  assert.deepEqual(await openHandoff(token, "secret"), { refreshToken: "rt-1", path: "/articles/abc" });
  // Khoá khác (secret của môi trường khác) hoặc gói bị sửa: không mở được.
  assert.equal(await openHandoff(token, "other"), null);
  assert.equal(await openHandoff(`${token}x`, "secret"), null);

  // Hết hạn thì bị từ chối.
  const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("codementor-client-handoff\0secret")));
  const expired = await new EncryptJWT({ rt: "rt", path: "/" })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setAudience("codementor-client-handoff")
    .setExpirationTime(Math.floor(Date.now() / 1000) - 5)
    .encrypt(key);
  assert.equal(await openHandoff(expired, "secret"), null);

  // Không redirect ra ngoài site.
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", 42]) assert.equal(safeHandoffPath(bad), null);
  assert.equal(safeHandoffPath("/workspace/demo?tab=documents"), "/workspace/demo?tab=documents");
  const outward = await sealHandoff({ refreshToken: "rt", path: "//evil.com" }, "secret");
  assert.equal(await openHandoff(outward, "secret"), null);

  console.log("handoff: ok");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
