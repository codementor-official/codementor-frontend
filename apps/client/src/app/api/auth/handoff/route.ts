import { NextRequest, NextResponse } from "next/server";
import { openHandoff, safeHandoffPath } from "@codementor/auth/handoff";
import { getWebAuthConfig } from "@/features/auth/server/auth-config";
import { endKeycloakSession, sessionFromRefreshToken, setSessionCookies } from "@/features/auth/server/auth-session";

/**
 * Nhận gói "super login" từ admin (xem `apps/admin/.../client-handoff`). Không kiểm Origin:
 * request này đến từ trang của admin, khác site là chuyện bình thường — thứ xác thực nó là
 * gói JWE chỉ server mới mở được, hết hạn sau 60 giây.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  // `path` đi kèm bản rõ chỉ để lùi về đúng trang khi gói hỏng; nó không cấp quyền gì.
  const fallbackPath = safeHandoffPath(form?.get("path"));
  const failed = (stage: string) => {
    console.error(`[auth] super login thất bại ở bước ${stage}`);
    const login = new URL("/login", request.url);
    login.searchParams.set("handoff", "failed");
    if (fallbackPath) login.searchParams.set("next", fallbackPath);
    return NextResponse.redirect(login, 303);
  };

  const handoff = typeof token === "string" ? await openHandoff(token, getWebAuthConfig().bffClientSecret) : null;
  // Không mở được: hết 60 giây, hoặc hai app không cùng KEYCLOAK_BFF_CLIENT_SECRET.
  if (!handoff) return failed("mở gói");

  let session;
  try {
    session = await sessionFromRefreshToken(handoff.refreshToken);
  } catch (cause) {
    console.error("[auth] super login: Keycloak từ chối refresh token", cause);
    return failed("đổi refresh token");
  }
  // Gói chỉ admin phát ra; vẫn kiểm lại ở đây để nó không thành cửa sau cho vai trò khác.
  if (session.user.role !== "admin") {
    await endKeycloakSession(session).catch(() => undefined);
    return failed("kiểm vai trò");
  }
  const response = NextResponse.redirect(new URL(handoff.path, request.url), 303);
  await setSessionCookies(response, { ...session, borrowed: true });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
