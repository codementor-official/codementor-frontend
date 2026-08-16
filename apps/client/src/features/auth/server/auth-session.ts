import { createHash } from "node:crypto";
import type { User } from "@codementor/types";
import { platformRoleOf } from "@codementor/auth";
import { createRemoteJWKSet, EncryptJWT, jwtDecrypt, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { getWebAuthConfig, keycloakRealmUrl } from "./auth-config";

/**
 * Phiên đăng nhập bằng mật khẩu của apps/client, giữ nguyên hình dạng đã chạy ổn ở
 * apps/admin: token nằm trong một JWE mã hoá đặt trong cookie HttpOnly, trình duyệt
 * không bao giờ đọc được access/refresh token.
 *
 * Đăng nhập Google/Facebook KHÔNG đi qua đây — luồng popup vẫn do oidc-client-ts giữ
 * token trong tab. Hai loại phiên tồn tại song song có chủ đích: gộp chúng lại đồng
 * nghĩa với việc viết lại luồng popup, thứ mà yêu cầu nói rõ là không được đụng tới.
 */
const SESSION_COOKIE = "codementor_web_session";
const SESSION_CHUNK_SIZE = 3500;
const MAX_SESSION_CHUNKS = 4;

export interface WebSession {
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

/** Keycloak từ chối thông tin đăng nhập, khác với "Keycloak hỏng". */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("invalid_grant");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Direct Access Grant, chạy TRỌN VẸN phía server bằng client bí mật
 * `codementor-web-bff`. Mật khẩu chỉ tồn tại trong tham số của hàm này và trong thân
 * request tới Keycloak — không ghi log, không lưu, không đi vào phiên trả về.
 *
 * Keycloak vẫn là nơi duy nhất kiểm mật khẩu, nên chính sách mật khẩu và brute-force
 * detection của realm vẫn có hiệu lực y như khi người dùng gõ trên trang của Keycloak.
 */
export async function signInWithPassword(username: string, password: string): Promise<WebSession> {
  const config = getWebAuthConfig();
  const tokens = await requestTokens({
    grant_type: "password",
    client_id: config.bffClientId,
    client_secret: config.bffClientSecret,
    scope: "openid profile email",
    username,
    password,
  });
  const accessPayload = await verifyToken(tokens.access_token, config.audience);
  return sessionFromTokens(tokens, accessPayload);
}

export async function refreshWebSession(session: WebSession): Promise<WebSession> {
  const config = getWebAuthConfig();
  const tokens = await requestTokens({
    grant_type: "refresh_token",
    client_id: config.bffClientId,
    client_secret: config.bffClientSecret,
    refresh_token: session.refreshToken,
  });
  const accessPayload = await verifyToken(tokens.access_token, config.audience);
  return sessionFromTokens({ ...tokens, id_token: tokens.id_token ?? session.idToken }, accessPayload);
}

export function sessionNeedsRefresh(session: WebSession): boolean {
  return session.accessExpiresAt <= Math.floor(Date.now() / 1000) + 30;
}

/**
 * Kết thúc phiên SSO phía Keycloak qua back-channel.
 *
 * Đăng nhập bằng Direct Access Grant không tạo cookie SSO trên trình duyệt (không có
 * điều hướng nào tới Keycloak cả), nên ở đây không cần — và không thể — dùng
 * end_session front-channel. Refresh token bị thu hồi cùng lúc: nếu chỉ xoá cookie,
 * refresh token vẫn còn hiệu lực ở Keycloak cho tới khi hết hạn.
 */
export async function endKeycloakSession(session: WebSession): Promise<void> {
  const config = getWebAuthConfig();
  await fetch(`${keycloakRealmUrl(config)}/protocol/openid-connect/logout`, {
    body: new URLSearchParams({
      client_id: config.bffClientId,
      client_secret: config.bffClientSecret,
      refresh_token: session.refreshToken,
    }),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
}

export async function setSessionCookies(response: NextResponse, session: WebSession): Promise<void> {
  const config = getWebAuthConfig();
  const encrypted = await encryptPayload(session, new Date(session.refreshExpiresAt * 1000));
  const chunks = encrypted.match(new RegExp(`.{1,${SESSION_CHUNK_SIZE}}`, "g")) ?? [];
  if (chunks.length > MAX_SESSION_CHUNKS) {
    throw new Error("Encrypted web session exceeds the supported cookie size");
  }

  clearSessionCookies(response);
  chunks.forEach((chunk, index) => {
    response.cookies.set(`${SESSION_COOKIE}.${index}`, chunk, {
      httpOnly: true,
      expires: new Date(session.refreshExpiresAt * 1000),
      path: "/",
      // Lax chứ không phải None: cookie phiên không có lý do gì phải đi kèm request
      // từ site khác, và đó là lớp chống CSRF thứ hai sau kiểm tra Origin ở route.
      sameSite: "lax",
      secure: config.secureCookies,
    });
  });
}

export async function readSession(request: NextRequest): Promise<WebSession | null> {
  let encrypted = "";
  for (let index = 0; index < MAX_SESSION_CHUNKS; index += 1) {
    const chunk = request.cookies.get(`${SESSION_COOKIE}.${index}`)?.value;
    if (!chunk) break;
    encrypted += chunk;
  }
  return encrypted ? decryptPayload<WebSession>(encrypted) : null;
}

export function clearSessionCookies(response: NextResponse): void {
  for (let index = 0; index < MAX_SESSION_CHUNKS; index += 1) {
    response.cookies.set(`${SESSION_COOKIE}.${index}`, "", { httpOnly: true, maxAge: 0, path: "/" });
  }
}

async function requestTokens(parameters: Record<string, string>): Promise<TokenResponse> {
  const config = getWebAuthConfig();
  const response = await fetch(`${keycloakRealmUrl(config)}/protocol/openid-connect/token`, {
    body: new URLSearchParams(parameters),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  // 401 dành cho sai mật khẩu, 400 `invalid_grant` dành cho cả sai mật khẩu lẫn tài
  // khoản bị khoá tạm bởi brute-force detection. Cả hai đều không được nói rõ lý do
  // cho trình duyệt — làm thế là chỉ điểm tài khoản nào có thật.
  if (response.status === 400 || response.status === 401) throw new InvalidCredentialsError();
  if (!response.ok) throw new Error(`Keycloak token request failed with status ${response.status}`);
  return (await response.json()) as TokenResponse;
}

async function verifyToken(token: string, audience: string): Promise<JWTPayload> {
  const config = getWebAuthConfig();
  const realmUrl = keycloakRealmUrl(config);
  const jwks = createRemoteJWKSet(new URL(`${realmUrl}/protocol/openid-connect/certs`));
  const result = await jwtVerify(token, jwks, { audience, issuer: realmUrl });
  return result.payload;
}

function sessionFromTokens(tokens: TokenResponse, payload: JWTPayload): WebSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    accessExpiresAt: now + tokens.expires_in,
    refreshExpiresAt: now + tokens.refresh_expires_in,
    user: userFromPayload(payload),
  };
}

/**
 * Claim của Keycloak → `User`, cùng bảng ánh xạ vai trò mà apps/admin và backend dùng.
 * `id` là `sub` của Keycloak chứ không phải `users.id`; hồ sơ đầy đủ vẫn lấy từ
 * `GET /api/v1/me` qua proxy.
 */
function userFromPayload(payload: JWTPayload): User {
  if (!payload.sub) throw new Error("Keycloak token is missing user identity claims");
  const username = typeof payload.preferred_username === "string" ? payload.preferred_username : "";
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
  return createHash("sha256").update(getWebAuthConfig().sessionSecret).digest();
}
