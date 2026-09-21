import { NextRequest, NextResponse } from "next/server";
import { clearSession, readSession, revokeSession } from "@/features/auth/server/session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const session = await readSession(request);
  if (session) await revokeSession(session).catch(() => undefined);
  const response = NextResponse.json({ ok: true });
  clearSession(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
