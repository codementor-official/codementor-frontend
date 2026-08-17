import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  InvalidCredentialsError,
  readSession,
  refreshWebSession,
  sessionNeedsRefresh,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

/**
 * Đường ra backend cho phiên đăng nhập bằng mật khẩu.
 *
 * Access token nằm trong cookie mã hoá nên trình duyệt không tự gắn `Authorization`
 * được; proxy này gắn hộ phía server. Phiên Google/Facebook không đi lối này — chúng
 * có token ngay trong tab và gọi thẳng Kong như trước.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function proxyBackend(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!SAFE_METHODS.has(request.method) && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  let session = await readSession(request);
  if (!session) {
    // Một lời gọi API mà không có phiên là chuyện đáng ghi lại, và ghi RIÊNG hai trường
    // hợp: không có mảnh cookie nào (trình duyệt chưa gửi, hoặc đã xoá vì hết hạn) khác
    // hẳn có cookie mà đọc không ra. Lần trước chính dòng log này chỉ ra thủ phạm.
    const chunks = request.cookies
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => name.startsWith("codementor_web_session"));
    console.error(
      `[auth] 401 không phiên: ${request.method} /${(await context.params).path.join("/")} —` +
        (chunks.length ? ` có cookie [${chunks.join(", ")}] nhưng đọc không ra` : " không có mảnh cookie phiên nào"),
    );
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  let refreshed = false;
  try {
    refreshed = sessionNeedsRefresh(session);
    if (refreshed) session = await refreshWebSession(session);
  } catch (cause) {
    // Chỉ `InvalidCredentialsError` mới nghĩa là refresh token thật sự đã chết —
    // Keycloak trả 400 `invalid_grant` khi nó hết hạn hoặc bị thu hồi. Mọi lỗi khác
    // (Keycloak nghẽn, DNS chớp, JWKS lấy hụt) là sự cố tạm thời, và xoá cookie ở đó
    // là đá người dùng ra khỏi phiên còn hiệu lực tới 30 phút vì một cú vấp một giây.
    // Refresh token vẫn còn nguyên, nên giữ cookie lại và để request sau thử lại.
    if (!(cause instanceof InvalidCredentialsError)) {
      console.error("[auth] gia hạn phiên thất bại tạm thời:", cause);
      return NextResponse.json(
        { message: "Không gia hạn được phiên đăng nhập. Vui lòng thử lại." },
        { status: 503 },
      );
    }
    console.error("[auth] refresh token bị Keycloak từ chối (hết hạn nhàn rỗi hoặc bị thu hồi), xoá phiên");
    const response = NextResponse.json({ message: "Session expired" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const { path } = await context.params;
  const baseUrl = (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  ).replace(/\/+$/, "");
  if (!baseUrl) {
    return NextResponse.json({ message: "API_INTERNAL_URL is not configured" }, { status: 500 });
  }

  const target = new URL(`${baseUrl}/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ["accept", "content-type", "if-match", "if-none-match", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      body: SAFE_METHODS.has(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      headers,
      method: request.method,
      redirect: "manual",
    });
  } catch {
    // Gateway down or unresolvable. Without this the fetch rejection escapes and Next
    // answers 500 with a zero-byte body, so the page can only say "status 500" — the one
    // failure a developer hits most often is the one that explains itself least. Every
    // other rejection in this file carries a message; this one now does too.
    return NextResponse.json(
      { message: `Không kết nối được API gateway tại ${baseUrl}.` },
      { status: 502 },
    );
  }
  // Một 401 từ đây là 401 của backend, không phải của BFF: phiên hợp lệ, access token vừa
  // được gắn, mà upstream vẫn từ chối. Hai nguyên nhân đó cần hai cách chữa khác hẳn nhau,
  // nên chúng phải phân biệt được trong log thay vì cùng hiện ra là "401".
  if (upstream.status === 401 || upstream.status === 403) {
    console.error(
      `[auth] upstream ${upstream.status} ${request.method} /${path.join("/")}` +
        ` (phiên còn hiệu lực, token vừa gắn${refreshed ? ", vừa gia hạn" : ""})`,
    );
  }
  const responseHeaders = new Headers();
  for (const name of ["content-type", "etag", "last-modified", "location", "x-request-id"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const response = new NextResponse(upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
    statusText: upstream.statusText,
  });
  if (refreshed) await setSessionCookies(response, session);
  return response;
}

export const GET = proxyBackend;
export const POST = proxyBackend;
export const PUT = proxyBackend;
export const PATCH = proxyBackend;
export const DELETE = proxyBackend;
