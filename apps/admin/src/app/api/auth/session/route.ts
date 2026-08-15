import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSession,
  refreshAdminSession,
  sessionNeedsRefresh,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

export async function GET(request: NextRequest) {
  let session = await readSession(request);
  if (!session) return NextResponse.json({ authenticated: false, user: null });

  try {
    if (sessionNeedsRefresh(session)) session = await refreshAdminSession(session);
    const response = NextResponse.json({ authenticated: true, user: session.user });
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }
}
