import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
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
  if (!session) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

  let refreshed = false;
  try {
    refreshed = sessionNeedsRefresh(session);
    if (refreshed) session = await refreshWebSession(session);
  } catch {
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
