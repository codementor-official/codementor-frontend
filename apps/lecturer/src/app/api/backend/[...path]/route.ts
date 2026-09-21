import { NextRequest, NextResponse } from "next/server";
import { clearSession, needsRefresh, readSession, refreshSession, setSession } from "@/features/auth/server/session";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!SAFE.has(request.method) && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }
  let session = await readSession(request);
  if (!session) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  let refreshed = false;
  try {
    refreshed = needsRefresh(session);
    if (refreshed) session = await refreshSession(session);
  } catch {
    const response = NextResponse.json({ message: "Session expired" }, { status: 401 });
    clearSession(response);
    return response;
  }
  const { path } = await context.params;
  const base = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return NextResponse.json({ message: "API_INTERNAL_URL is not configured" }, { status: 500 });
  const target = new URL(`${base}/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ["accept", "content-type", "if-match", "if-none-match", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  try {
    const upstream = await fetch(target, {
      body: SAFE.has(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store", headers, method: request.method, redirect: "manual",
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "etag", "last-modified", "location", "x-request-id"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const response = new NextResponse(upstream.body, { headers: responseHeaders,
      status: upstream.status, statusText: upstream.statusText });
    if (refreshed) await setSession(response, session);
    return response;
  } catch {
    return NextResponse.json({ message: "Backend unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
