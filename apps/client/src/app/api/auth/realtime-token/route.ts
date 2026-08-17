import { NextRequest, NextResponse } from "next/server";
import {
  readSession,
  refreshWebSession,
  sessionNeedsRefresh,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

/**
 * Vé vào cửa WebSocket cho phiên đăng nhập bằng mật khẩu.
 *
 * Phiên đó giữ token trong cookie HttpOnly nên JavaScript không đọc được — mà bắt tay
 * Socket.IO thì lại phải tự gửi token lên. Route này là chỗ duy nhất token rời khỏi
 * server, và chỉ khi chính chủ hỏi bằng cookie phiên của họ.
 *
 * Phiên Google/Facebook không gọi tới đây: oidc-client-ts đã giữ sẵn access token trong
 * tab, và luồng popup đó không được đụng vào.
 *
 * Trả access token (sống ~5 phút) chứ không phải refresh token: vé bắt tay lộ ra thì chỉ
 * dùng được trong vài phút, còn refresh token lộ là mất phiên.
 */
export async function GET(request: NextRequest) {
  let session = await readSession(request);
  if (!session) {
    return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    // Token sắp hết hạn thì gia hạn ngay tại đây: đưa một token chết cho socket nghĩa là
    // client bị từ chối bắt tay rồi thử lại vòng quanh mà không hiểu vì sao.
    const refreshed = sessionNeedsRefresh(session);
    if (refreshed) session = await refreshWebSession(session);

    const response = NextResponse.json({
      token: session.accessToken,
      expiresAt: session.accessExpiresAt,
    });
    if (refreshed) await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ message: "Phiên đã hết hạn" }, { status: 401 });
  }
}
