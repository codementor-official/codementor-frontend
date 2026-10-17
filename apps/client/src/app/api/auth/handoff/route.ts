import { NextRequest, NextResponse } from "next/server";
import { openHandoff } from "@codementor/auth/handoff";
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
  const handoff = typeof token === "string" ? await openHandoff(token, getWebAuthConfig().bffClientSecret) : null;
  if (!handoff) return NextResponse.redirect(new URL("/login?handoff=expired", request.url), 303);

  try {
    const session = await sessionFromRefreshToken(handoff.refreshToken);
    // Gói chỉ admin phát ra; vẫn kiểm lại ở đây để nó không thành cửa sau cho vai trò khác.
    if (session.user.role !== "admin") {
      await endKeycloakSession(session).catch(() => undefined);
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }
    const response = NextResponse.redirect(new URL(handoff.path, request.url), 303);
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?handoff=expired", request.url), 303);
  }
}
