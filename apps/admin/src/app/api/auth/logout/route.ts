import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthConfig, publicKeycloakRealmUrl } from "@/features/auth/server/auth-config";
import { clearSessionCookies, readSession } from "@/features/auth/server/auth-session";

export async function GET(request: NextRequest) {
  const config = getAdminAuthConfig();
  const session = await readSession(request);
  const postLogoutUri = `${request.nextUrl.origin}/login`;
  const logoutUrl = new URL(
    `${publicKeycloakRealmUrl(request.nextUrl.origin, config)}/protocol/openid-connect/logout`,
  );
  logoutUrl.searchParams.set("client_id", config.clientId);
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutUri);
  if (session?.idToken) logoutUrl.searchParams.set("id_token_hint", session.idToken);

  const response = NextResponse.redirect(logoutUrl);
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
