import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthConfig, publicKeycloakRealmUrl } from "@/features/auth/server/auth-config";
import {
  createAuthFlow,
  createCodeChallenge,
  setAuthFlowCookie,
} from "@/features/auth/server/auth-session";

export async function GET(request: NextRequest) {
  const config = getAdminAuthConfig();
  const flow = createAuthFlow(request.nextUrl.searchParams.get("returnTo") ?? "/dashboard");
  const callbackUri = `${request.nextUrl.origin}/api/auth/callback`;
  const authorizationUrl = new URL(
    `${publicKeycloakRealmUrl(request.nextUrl.origin, config)}/protocol/openid-connect/auth`,
  );
  authorizationUrl.search = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: createCodeChallenge(flow.verifier),
    code_challenge_method: "S256",
    nonce: flow.nonce,
    redirect_uri: callbackUri,
    response_mode: "query",
    response_type: "code",
    scope: "openid profile email",
    state: flow.state,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  await setAuthFlowCookie(response, flow);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
