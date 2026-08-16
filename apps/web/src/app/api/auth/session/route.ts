import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSession,
  refreshWebSession,
  sessionNeedsRefresh,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

/**
 * Trình duyệt hỏi "tôi còn phiên mật khẩu nào không?" khi tải trang. Trả về hồ sơ suy
 * từ claim đã kiểm chữ ký, không trả token — token ở lại trong cookie mã hoá.
 */
export async function GET(request: NextRequest) {
  let session = await readSession(request);
  if (!session) return NextResponse.json({ authenticated: false, user: null });

  try {
    const refreshed = sessionNeedsRefresh(session);
    if (refreshed) session = await refreshWebSession(session);
    const response = NextResponse.json({ authenticated: true, user: session.user });
    if (refreshed) await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    // Refresh token đã bị thu hồi (đăng xuất ở tab khác) hoặc hết hạn: dọn cookie chết
    // ngay tại đây, nếu không mỗi lần tải trang lại tốn một vòng gọi Keycloak vô ích.
    const response = NextResponse.json({ authenticated: false, user: null });
    clearSessionCookies(response);
    return response;
  }
}
