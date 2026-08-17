import { NextRequest, NextResponse } from "next/server";
import {
  InvalidCredentialsError,
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
  } catch (cause) {
    // Cùng cách phân biệt như `/api/auth/session` và proxy `/api/backend`: chỉ
    // `invalid_grant` mới là phiên chết. Keycloak vấp một nhịp mà trả 401 ở đây thì client
    // kết luận đã đăng xuất và thôi thử lại, trong khi phiên vẫn còn hiệu lực.
    if (cause instanceof InvalidCredentialsError) {
      return NextResponse.json({ message: "Phiên đã hết hạn" }, { status: 401 });
    }
    console.error("[auth] không cấp được vé realtime:", cause);
    return NextResponse.json({ message: "Chưa cấp được vé, thử lại sau" }, { status: 503 });
  }
}
