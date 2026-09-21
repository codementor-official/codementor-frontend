import { createHash, randomBytes } from "node:crypto";
import type { User } from "@codementor/types";
import { hasRole, platformRoleOf } from "@codementor/auth";
import {
  createRemoteJWKSet,
  EncryptJWT,
  jwtDecrypt,
  jwtVerify,
  type JWTPayload,
} from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { getAdminAuthConfig, keycloakRealmUrl } from "./auth-config";

const FLOW_COOKIE = "codementor_admin_auth_flow";
const SESSION_COOKIE = "codementor_admin_session";
const SESSION_CHUNK_SIZE = 3500;
const MAX_SESSION_CHUNKS = 4;

export interface AuthFlow {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
}

export interface AdminSession {
  tokenClient?: "admin" | "bff";
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  user: User;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in: number;
}

export function createAuthFlow(returnTo: string): AuthFlow {
  return {
    state: randomUrlSafeValue(32),
    nonce: randomUrlSafeValue(32),
    verifier: randomUrlSafeValue(64),
    returnTo: safeReturnTo(returnTo),
  };
}

export function createCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function setAuthFlowCookie(response: NextResponse, flow: AuthFlow): Promise<void> {
  const config = getAdminAuthConfig();
  response.cookies.set(FLOW_COOKIE, await encryptPayload(flow, "10m"), {
    httpOnly: true,
    maxAge: 600,
    path: "/api/auth",
    sameSite: "lax",
    secure: config.secureCookies,
  });
}

export async function readAuthFlow(request: NextRequest): Promise<AuthFlow | null> {
  const value = request.cookies.get(FLOW_COOKIE)?.value;
  return value ? decryptPayload<AuthFlow>(value) : null;
}

export function clearAuthFlowCookie(response: NextResponse): void {
  response.cookies.set(FLOW_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/api/auth" });
}

export async function setSessionCookies(
  response: NextResponse,
  session: AdminSession,
): Promise<void> {
  const config = getAdminAuthConfig();
  const encrypted = await encryptPayload(session, new Date(session.refreshExpiresAt * 1000));
  const chunks = encrypted.match(new RegExp(`.{1,${SESSION_CHUNK_SIZE}}`, "g")) ?? [];
  if (chunks.length > MAX_SESSION_CHUNKS) {
    throw new Error("Encrypted admin session exceeds the supported cookie size");
  }

  clearSessionCookies(response);
  chunks.forEach((chunk, index) => {
    response.cookies.set(`${SESSION_COOKIE}.${index}`, chunk, {
      httpOnly: true,
      expires: new Date(session.refreshExpiresAt * 1000),
      path: "/",
      sameSite: "lax",
      secure: config.secureCookies,
    });
  });
}

export async function readSession(request: NextRequest): Promise<AdminSession | null> {
  let encrypted = "";
  for (let index = 0; index < MAX_SESSION_CHUNKS; index += 1) {
    const chunk = request.cookies.get(`${SESSION_COOKIE}.${index}`)?.value;
    if (!chunk) break;
    encrypted += chunk;
  }
  return encrypted ? decryptPayload<AdminSession>(encrypted) : null;
}

export function clearSessionCookies(response: NextResponse): void {
  for (let index = 0; index < MAX_SESSION_CHUNKS; index += 1) {
    response.cookies.set(`${SESSION_COOKIE}.${index}`, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
  }
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  verifier: string;
  nonce: string;
  redirectUri: string;
}): Promise<AdminSession> {
  const config = getAdminAuthConfig();
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code: input.code,
    code_verifier: input.verifier,
    redirect_uri: input.redirectUri,
  });

  if (!tokens.id_token) throw new Error("Keycloak did not return an ID token");
  await verifyToken(tokens.id_token, config.clientId, input.nonce);
  const accessPayload = await verifyToken(tokens.access_token, config.audience);
  return sessionFromTokens(tokens, accessPayload, "admin");
}

export class LoginError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function signInWithPassword(username: string, password: string): Promise<AdminSession> {
  const config = getAdminAuthConfig();
  if (!config.bffClientSecret) throw new LoginError(503, "Đăng nhập chưa được cấu hình trên máy chủ.");
  let tokens: TokenResponse;
  try {
    tokens = await requestTokens({
      grant_type: "password",
      client_id: config.bffClientId,
      client_secret: config.bffClientSecret,
      username,
      password,
      scope: "openid profile email",
    });
  } catch (error) {
    if (error instanceof TokenRequestError && error.status === 400) {
      throw new LoginError(401, "Email hoặc mật khẩu không đúng.");
    }
    throw new LoginError(502, "Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại.");
  }
  const payload = await verifyToken(tokens.access_token, config.audience);
  const session = sessionFromTokens(tokens, payload, "bff");
  if (!hasRole(session.user, "admin")) {
    await endAdminKeycloakSession(session).catch(() => undefined);
    throw new LoginError(403, "Tài khoản chưa có quyền quản trị.");
  }
  return session;
}

export async function refreshAdminSession(session: AdminSession): Promise<AdminSession> {
  const config = getAdminAuthConfig();
  const isBff = session.tokenClient === "bff";
  const tokens = await requestTokens({
    grant_type: "refresh_token",
    client_id: isBff ? config.bffClientId : config.clientId,
    ...(isBff ? { client_secret: config.bffClientSecret } : {}),
    refresh_token: session.refreshToken,
  });
  const accessPayload = await verifyToken(tokens.access_token, config.audience);
  return sessionFromTokens(
    { ...tokens, id_token: tokens.id_token ?? session.idToken },
    accessPayload,
    session.tokenClient ?? "admin",
  );
}

export function sessionNeedsRefresh(session: AdminSession): boolean {
  return session.accessExpiresAt <= Math.floor(Date.now() / 1000) + 30;
}

/**
 * Kết thúc phiên qua back-channel — thu hồi refresh token của RIÊNG client
 * `codementor-admin`, không điều hướng trình duyệt tới Keycloak.
 *
 * Trước đây route `/api/auth/logout` redirect thẳng tới `end_session` (front-channel):
 * việc đó xoá cookie SSO dùng chung ở id.codementor.cloud và khiến Keycloak thu hồi
 * TOÀN BỘ phiên người dùng, kể cả apps/lecturer và apps/client (khi đăng nhập popup)
 * đang mở ở tab khác. `prompt: "login"` ở route đăng nhập đã buộc luôn hiện form bất
 * kể cookie SSO còn sống hay không, nên không cần dựa vào việc xoá cookie đó để "an
 * toàn" — chỉ cần refresh token của app này chết là đủ. Phiên cũ dùng public client
 * `codementor-admin`; form đăng nhập mới dùng confidential BFF client, vì vậy hàm tự chọn
 * đúng client và chỉ gửi client secret cho phiên BFF.
 */
export async function endAdminKeycloakSession(session: AdminSession): Promise<void> {
  const config = getAdminAuthConfig();
  const isBff = session.tokenClient === "bff";
  await fetch(`${keycloakRealmUrl(config)}/protocol/openid-connect/logout`, {
    body: new URLSearchParams({
      client_id: isBff ? config.bffClientId : config.clientId,
      ...(isBff ? { client_secret: config.bffClientSecret } : {}),
      refresh_token: session.refreshToken,
    }),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
}

async function requestTokens(parameters: Record<string, string>): Promise<TokenResponse> {
  const config = getAdminAuthConfig();
  const response = await fetch(`${keycloakRealmUrl(config)}/protocol/openid-connect/token`, {
    body: new URLSearchParams(parameters),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  if (!response.ok) throw new TokenRequestError(response.status);
  return (await response.json()) as TokenResponse;
}

class TokenRequestError extends Error {
  constructor(readonly status: number) {
    super(`Keycloak token request failed with status ${status}`);
  }
}

async function verifyToken(
  token: string,
  audience: string,
  nonce?: string,
): Promise<JWTPayload> {
  const config = getAdminAuthConfig();
  const realmUrl = keycloakRealmUrl(config);
  const jwks = createRemoteJWKSet(new URL(`${realmUrl}/protocol/openid-connect/certs`));
  const result = await jwtVerify(token, jwks, { audience, issuer: realmUrl });
  if (nonce && result.payload.nonce !== nonce) throw new Error("Invalid OIDC nonce");
  return result.payload;
}

function sessionFromTokens(tokens: TokenResponse, payload: JWTPayload, tokenClient: "admin" | "bff"): AdminSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    tokenClient,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    accessExpiresAt: now + tokens.expires_in,
    refreshExpiresAt: now + tokens.refresh_expires_in,
    user: userFromPayload(payload),
  };
}

/**
 * Claim của Keycloak → `User`, đúng hình dạng mà backend trả từ `GET /api/v1/me`.
 *
 * Vai trò quy về một giá trị chữ thường qua `platformRoleOf`: realm mang cả
 * `STUDENT`/`LECTURER`/`ADMIN` lẫn bản chữ thường cũ, còn từ vựng nội bộ phải khớp enum
 * `platform_role` trong PostgreSQL. Cùng bảng ánh xạ với
 * `libs/platform/src/auth/jwt-payload.ts` bên backend.
 *
 * `id` là `sub` của Keycloak, KHÔNG phải `users.id`. Đủ để hiển thị và kiểm vai trò;
 * chỗ nào cần so quyền sở hữu thì gọi `/api/v1/me` qua proxy.
 */
function userFromPayload(payload: JWTPayload): User {
  const username = typeof payload.preferred_username === "string" ? payload.preferred_username : "";
  if (!payload.sub) throw new Error("Keycloak token is missing user identity claims");
  const realmAccess = payload.realm_access as { roles?: unknown } | undefined;
  const realmRoles = Array.isArray(realmAccess?.roles)
    ? realmAccess.roles.filter((role): role is string => typeof role === "string")
    : [];

  return {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    displayName: typeof payload.name === "string" ? payload.name : username || payload.sub,
    role: platformRoleOf(realmRoles),
  };
}

async function encryptPayload(payload: object, expiration: string | Date): Promise<string> {
  return new EncryptJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .encrypt(sessionEncryptionKey());
}

async function decryptPayload<T>(value: string): Promise<T | null> {
  try {
    const result = await jwtDecrypt(value, sessionEncryptionKey());
    return result.payload as T;
  } catch {
    return null;
  }
}

function sessionEncryptionKey(): Uint8Array {
  return createHash("sha256").update(getAdminAuthConfig().sessionSecret).digest();
}

function randomUrlSafeValue(size: number): string {
  return randomBytes(size).toString("base64url");
}

function safeReturnTo(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
