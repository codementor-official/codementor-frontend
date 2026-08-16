import { NextRequest, NextResponse } from "next/server";
import { allowLoginAttempt } from "@/features/auth/server/rate-limit";
import {
  InvalidCredentialsError,
  setSessionCookies,
  signInWithPassword,
} from "@/features/auth/server/auth-session";

/**
 * Điểm chạm duy nhất của trình duyệt với việc đăng nhập bằng mật khẩu.
 *
 * Trình duyệt chỉ gửi `{ username, password }` tới đây; toàn bộ việc nói chuyện với
 * Keycloak — client secret, Direct Access Grant, đổi và kiểm token — nằm phía server.
 * Không có `console.log` nào trong file này chạm vào mật khẩu, và mật khẩu cũng không
 * đi vào phiên hay cookie: nó chết ngay khi request tới Keycloak kết thúc.
 */
export async function POST(request: NextRequest) {
  if (!isSecureTransport(request)) {
    return NextResponse.json({ message: "Yêu cầu phải đi qua HTTPS." }, { status: 400 });
  }
  // Không có cookie nào được dùng để xác thực request này, nhưng kiểm Origin vẫn đáng
  // giá: nó chặn form ở site khác POST thẳng vào đây.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  if (!allowLoginAttempt(clientKey(request))) {
    return NextResponse.json(
      { message: "Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại." },
      { status: 429 },
    );
  }

  const credentials = (await request.json().catch(() => null)) as {
    username?: unknown;
    password?: unknown;
  } | null;
  const username = typeof credentials?.username === "string" ? credentials.username.trim() : "";
  const password = typeof credentials?.password === "string" ? credentials.password : "";
  if (!username || !password) {
    return NextResponse.json(
      { message: "Vui lòng nhập email/tên đăng nhập và mật khẩu." },
      { status: 400 },
    );
  }

  try {
    const session = await signInWithPassword(username, password);
    const response = NextResponse.json({ user: session.user });
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (cause) {
    if (cause instanceof InvalidCredentialsError) {
      return NextResponse.json(
        { message: "Email/tên đăng nhập hoặc mật khẩu không đúng." },
        { status: 401 },
      );
    }
    // Keycloak sập, mạng lỗi, cấu hình sai — không phải lỗi của người dùng, và thông
    // điệp phải khác hẳn để họ không ngồi gõ lại mật khẩu đúng.
    return NextResponse.json(
      { message: "Không kết nối được dịch vụ đăng nhập. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}

/**
 * Mật khẩu không được đi qua HTTP ở production. Ở dev thì http://localhost vẫn phải
 * chạy được, nên chỉ chặn khi đã build production.
 */
function isSecureTransport(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  return (forwarded ?? request.nextUrl.protocol.replace(":", "")) === "https";
}

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
