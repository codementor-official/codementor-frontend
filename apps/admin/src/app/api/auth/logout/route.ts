import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, endAdminKeycloakSession, readSession } from "@/features/auth/server/auth-session";

export async function GET(request: NextRequest) {
  const session = await readSession(request);
  // Back-channel only — không redirect trình duyệt tới Keycloak. Xem
  // `endAdminKeycloakSession` để biết lý do: front-channel end_session xoá cookie SSO
  // dùng chung và đá luôn apps/lecturer, apps/client ra khỏi phiên của họ.
  if (session) await endAdminKeycloakSession(session).catch(() => undefined);

  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
