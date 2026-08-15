import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthFlowCookie,
  exchangeAuthorizationCode,
  readAuthFlow,
  setSessionCookies,
} from "@/features/auth/server/auth-session";

export async function GET(request: NextRequest) {
  const flow = await readAuthFlow(request);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!flow || !code || state !== flow.state) {
    return NextResponse.redirect(new URL("/login?error=invalid_callback", request.url));
  }

  try {
    const session = await exchangeAuthorizationCode({
      code,
      nonce: flow.nonce,
      redirectUri: `${request.nextUrl.origin}/api/auth/callback`,
      verifier: flow.verifier,
    });
    const response = NextResponse.redirect(new URL(flow.returnTo, request.url));
    clearAuthFlowCookie(response);
    await setSessionCookies(response, session);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
    clearAuthFlowCookie(response);
    return response;
  }
}
