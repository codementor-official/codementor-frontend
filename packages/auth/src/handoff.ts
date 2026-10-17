import { EncryptJWT, jwtDecrypt } from "jose";

/**
 * Gói chuyển phiên admin → client ("super login"): admin bấm xem nội dung là sang client
 * đăng nhập sẵn bằng CHÍNH tài khoản admin đó, không tạo tài khoản, không gõ lại mật khẩu.
 *
 * Gói là một JWE chứa refresh token mới xin cho riêng client. Hai BFF đều dùng client
 * Keycloak `codementor-web-bff`, nên refresh token ấy client đổi được, và khoá mã hoá suy ra
 * từ secret của client đó — thứ chỉ hai server biết, trình duyệt chỉ chuyển gói đi.
 * Realm tắt `revokeRefreshToken`, nên xin bộ token này không làm hỏng phiên của admin.
 *
 * shortcut: gói dùng lại được trong TTL 60 giây (không có kho lưu chung để đánh dấu đã dùng);
 * nó chỉ đi trong thân POST, không qua URL hay log. Thêm kho nonce nếu cần dùng-một-lần thật.
 */
const PURPOSE = "codementor-client-handoff";
export const HANDOFF_TTL_SECONDS = 60;

async function handoffKey(bffClientSecret: string): Promise<Uint8Array> {
  if (!bffClientSecret) throw new Error("KEYCLOAK_BFF_CLIENT_SECRET is required for session handoff");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${PURPOSE}\0${bffClientSecret}`));
  return new Uint8Array(digest);
}

/** Chỉ đường dẫn trong cùng site: chặn `//evil.com`, `https://…` và `\\` — tránh open redirect. */
export function safeHandoffPath(path: unknown): string | null {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : null;
}

export async function sealHandoff(input: { refreshToken: string; path: string }, bffClientSecret: string): Promise<string> {
  return new EncryptJWT({ rt: input.refreshToken, path: input.path })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setAudience(PURPOSE)
    .setIssuedAt()
    .setExpirationTime(`${HANDOFF_TTL_SECONDS}s`)
    .encrypt(await handoffKey(bffClientSecret));
}

/** `null` khi gói hết hạn, bị sửa, mã hoá bằng khoá khác, hoặc trỏ ra ngoài site. */
export async function openHandoff(
  token: string,
  bffClientSecret: string,
): Promise<{ refreshToken: string; path: string } | null> {
  try {
    const { payload } = await jwtDecrypt(token, await handoffKey(bffClientSecret), { audience: PURPOSE });
    const path = safeHandoffPath(payload.path);
    return typeof payload.rt === "string" && path ? { refreshToken: payload.rt, path } : null;
  } catch {
    return null;
  }
}
