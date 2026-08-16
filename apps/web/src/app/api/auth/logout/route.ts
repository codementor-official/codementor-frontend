import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  endKeycloakSession,
  readSession,
} from "@/features/auth/server/auth-session";

/**
 * Kết thúc phiên mật khẩu: thu hồi refresh token ở Keycloak TRƯỚC, xoá cookie SAU.
 *
 * Chỉ xoá cookie thôi là cách hỏng kinh điển — trình duyệt trông như đã đăng xuất
 * nhưng phiên ở Keycloak vẫn sống, và refresh token bị lấy cắp vẫn đổi được token mới.
 *
 * Route này luôn xoá cookie kể cả khi Keycloak không trả lời: phía CodeMentor phải
 * đăng xuất được ngay cả khi dịch vụ định danh đang chết.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

  const session = await readSession(request);
  if (session) await endKeycloakSession(session).catch(() => undefined);

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
