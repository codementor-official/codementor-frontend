import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSession,
  refreshAdminSession,
  sessionNeedsRefresh,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

/**
 * Vé vào cửa WebSocket cho chuông thông báo.
 *
 * Phiên quản trị giữ token trong cookie HttpOnly nên JavaScript không đọc được — mà bắt
 * tay Socket.IO thì lại phải tự gửi token lên. Route này là chỗ DUY NHẤT token rời khỏi
 * server, và chỉ khi chính chủ hỏi bằng cookie phiên của họ.
 *
 * Trả access token (sống ~5 phút) chứ không phải refresh token: vé bắt tay lộ ra thì chỉ
 * dùng được trong vài phút, còn refresh token lộ là mất phiên.
 */
export async function GET(request: NextRequest) {
  let session = await readSession(request);
  if (!session) return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });

  try {
    // Gia hạn ngay tại đây nếu token sắp chết: đưa một token hết hạn cho socket nghĩa là
    // client bị từ chối bắt tay rồi thử lại vòng quanh mà không hiểu vì sao.
    const refreshed = sessionNeedsRefresh(session);
    if (refreshed) session = await refreshAdminSession(session);

    const response = NextResponse.json({ token: session.accessToken });
    if (refreshed) await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.json({ message: "Phiên đã hết hạn" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }
}
