import { NextRequest, NextResponse } from "next/server";
import { allowLoginAttempt } from "@/features/auth/server/rate-limit";
import { createAccount, EmailTakenError, RejectedPasswordError } from "@/features/auth/server/keycloak-admin";
import { setSessionCookies, signInWithPassword } from "@/features/auth/server/auth-session";

/** Ngắn hơn thì Keycloak cũng từ chối; chặn sớm để khỏi tốn một vòng gọi. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Đăng ký ngay trên giao diện CodeMentor, không nhảy sang trang của Keycloak.
 *
 * Tạo tài khoản xong thì đăng nhập luôn bằng chính thông tin vừa nhập — bắt người dùng
 * gõ lại mật khẩu vừa đặt là thừa. Cùng một đường phiên với `/api/auth/login`.
 */
export async function POST(request: NextRequest) {
  if (!isSecureTransport(request)) {
    return NextResponse.json({ message: "Yêu cầu phải đi qua HTTPS." }, { status: 400 });
  }
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  // Cùng bộ đếm với đăng nhập nhưng khác khoá: tạo tài khoản hàng loạt cũng là lạm dụng.
  if (!allowLoginAttempt(`register:${clientKey(request)}`)) {
    return NextResponse.json(
      { message: "Bạn đã thử quá nhiều lần. Vui lòng đợi một phút rồi thử lại." },
      { status: 429 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const displayName = typeof payload?.displayName === "string" ? payload.displayName.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!displayName || !email || !password) {
    return NextResponse.json({ message: "Vui lòng điền đầy đủ thông tin." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Email không hợp lệ." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { message: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` },
      { status: 400 },
    );
  }

  try {
    await createAccount({ displayName, email, password });
  } catch (cause) {
    if (cause instanceof EmailTakenError) {
      return NextResponse.json(
        { message: "Email này đã được đăng ký. Bạn hãy đăng nhập." },
        { status: 409 },
      );
    }
    if (cause instanceof RejectedPasswordError) {
      return NextResponse.json({ message: cause.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Không tạo được tài khoản. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }

  try {
    const session = await signInWithPassword(email, password);
    const response = NextResponse.json({ user: session.user });
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    // Tài khoản đã tạo xong, chỉ bước đăng nhập tự động hỏng. Nói đúng như vậy, đừng
    // để người dùng bấm "Đăng ký" lần nữa rồi nhận lỗi trùng email.
    return NextResponse.json(
      { message: "Đã tạo tài khoản nhưng chưa đăng nhập được. Bạn hãy thử đăng nhập.", created: true },
      { status: 202 },
    );
  }
}

function isSecureTransport(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  return (forwarded ?? request.nextUrl.protocol.replace(":", "")) === "https";
}

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
