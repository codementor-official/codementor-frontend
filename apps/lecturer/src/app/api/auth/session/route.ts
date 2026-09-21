import { NextRequest, NextResponse } from "next/server";
import { clearSession, needsRefresh, readSession, refreshSession, setSession } from "@/features/auth/server/session";

export async function GET(request: NextRequest) {
  let session = await readSession(request);
  if (!session) return NextResponse.json({ authenticated: false, user: null }, { headers: { "Cache-Control": "no-store" } });
  try {
    const refreshed = needsRefresh(session);
    if (refreshed) session = await refreshSession(session);
    const response = NextResponse.json({ authenticated: true, user: session.user });
    if (refreshed) await setSession(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    clearSession(response);
    return response;
  }
}
