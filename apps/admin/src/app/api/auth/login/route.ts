import { NextRequest, NextResponse } from "next/server";
import { LoginError, setSessionCookies, signInWithPassword } from "@/features/auth/server/auth-session";

const attempts = new Map<string, number[]>();

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" &&
      (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")) !== "https") {
    return NextResponse.json({ message: "Yêu cầu phải đi qua HTTPS." }, { status: 400 });
  }
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((at) => now - at < 60_000);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 10_000) {
    for (const [key, values] of attempts) {
      if (values.every((at) => now - at >= 60_000)) attempts.delete(key);
    }
  }
  if (recent.length > 10) {
    return NextResponse.json({ message: "Thử quá nhiều lần. Vui lòng đợi một phút." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { username?: unknown; password?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ message: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
  }
  try {
    const session = await signInWithPassword(username, password);
    const response = NextResponse.json({ user: session.user });
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const status = error instanceof LoginError ? error.status : 502;
    const message = error instanceof LoginError ? error.message : "Không thể xác minh phiên đăng nhập.";
    return NextResponse.json({ message }, { status });
  }
}
