import { createHash } from "node:crypto";
import { hasAnyRole, platformRoleOf } from "@codementor/auth";
import type { User } from "@codementor/types";
import { createRemoteJWKSet, EncryptJWT, jwtDecrypt, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE = "codementor_lecturer_session";
const CHUNK_SIZE = 3500;
const MAX_CHUNKS = 4;

interface Config {
  realmUrl: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  sessionSecret: string;
  secure: boolean;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface LecturerSession {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  user: User;
}

export class LoginError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

function config(): Config {
  const sessionSecret = process.env.AUTH_SESSION_SECRET ?? "";
  if (sessionSecret.length < 32) throw new LoginError(503, "Phiên đăng nhập chưa được cấu hình.");
  return {
    realmUrl: `${(process.env.KEYCLOAK_INTERNAL_URL ?? process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "https://id.codementor.cloud").replace(/\/+$/, "")}/realms/${encodeURIComponent(process.env.KEYCLOAK_REALM ?? "codementor")}`,
    clientId: process.env.KEYCLOAK_BFF_CLIENT_ID ?? "codementor-web-bff",
    clientSecret: process.env.KEYCLOAK_BFF_CLIENT_SECRET ?? "",
    audience: process.env.KEYCLOAK_API_AUDIENCE ?? "codementor-api",
    sessionSecret,
    secure: process.env.AUTH_COOKIE_SECURE === "true",
  };
}

async function requestTokens(params: Record<string, string>): Promise<Tokens> {
  const response = await fetch(`${config().realmUrl}/protocol/openid-connect/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params), cache: "no-store",
  });
  if (!response.ok) throw new LoginError(response.status === 400 ? 401 : 502,
    response.status === 400 ? "Email hoặc mật khẩu không đúng." : "Không thể kết nối dịch vụ đăng nhập.");
  return response.json() as Promise<Tokens>;
}

async function sessionFromTokens(tokens: Tokens): Promise<LecturerSession> {
  const settings = config();
  const payload = (await jwtVerify(tokens.access_token,
    createRemoteJWKSet(new URL(`${settings.realmUrl}/protocol/openid-connect/certs`)),
    { issuer: settings.realmUrl, audience: settings.audience })).payload;
  const roles = (payload.realm_access as { roles?: unknown } | undefined)?.roles;
  const realmRoles = Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [];
  if (!payload.sub) throw new LoginError(502, "Token thiếu định danh người dùng.");
  const user: User = {
    id: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    displayName: typeof payload.name === "string" ? payload.name :
      (typeof payload.preferred_username === "string" ? payload.preferred_username : payload.sub),
    role: platformRoleOf(realmRoles),
  };
  const now = Math.floor(Date.now() / 1000);
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token,
    accessExpiresAt: now + tokens.expires_in, refreshExpiresAt: now + tokens.refresh_expires_in, user };
}

export async function signInWithPassword(username: string, password: string): Promise<LecturerSession> {
  const settings = config();
  if (!settings.clientSecret) throw new LoginError(503, "Đăng nhập chưa được cấu hình trên máy chủ.");
  const tokens = await requestTokens({ grant_type: "password", client_id: settings.clientId,
    client_secret: settings.clientSecret, username, password, scope: "openid profile email" });
  const session = await sessionFromTokens(tokens);
  if (!hasAnyRole(session.user, ["lecturer", "admin"])) {
    await revokeSession(session).catch(() => undefined);
    throw new LoginError(403, "Tài khoản chưa có quyền giảng viên.");
  }
  return session;
}

export async function refreshSession(session: LecturerSession): Promise<LecturerSession> {
  const settings = config();
  return sessionFromTokens(await requestTokens({ grant_type: "refresh_token",
    client_id: settings.clientId, client_secret: settings.clientSecret,
    refresh_token: session.refreshToken }));
}

export function needsRefresh(session: LecturerSession): boolean {
  return session.accessExpiresAt <= Math.floor(Date.now() / 1000) + 30;
}

export async function revokeSession(session: LecturerSession): Promise<void> {
  const settings = config();
  await fetch(`${settings.realmUrl}/protocol/openid-connect/logout`, {
    method: "POST", cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: settings.clientId,
      client_secret: settings.clientSecret, refresh_token: session.refreshToken }),
  });
}

function key(): Uint8Array { return createHash("sha256").update(config().sessionSecret).digest(); }

export async function readSession(request: NextRequest): Promise<LecturerSession | null> {
  let encrypted = "";
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    const part = request.cookies.get(`${COOKIE}.${index}`)?.value;
    if (!part) break;
    encrypted += part;
  }
  if (!encrypted) return null;
  try { return (await jwtDecrypt(encrypted, key())).payload as unknown as LecturerSession; }
  catch { return null; }
}

export function clearSession(response: NextResponse): void {
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    response.cookies.set(`${COOKIE}.${index}`, "", { httpOnly: true, maxAge: 0, path: "/" });
  }
}

export async function setSession(response: NextResponse, session: LecturerSession): Promise<void> {
  const encrypted = await new EncryptJWT(session as unknown as JWTPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" }).setIssuedAt()
    .setExpirationTime(new Date(session.refreshExpiresAt * 1000)).encrypt(key());
  const chunks = encrypted.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
  if (chunks.length > MAX_CHUNKS) throw new Error("Lecturer session exceeds cookie size");
  clearSession(response);
  chunks.forEach((chunk, index) => response.cookies.set(`${COOKIE}.${index}`, chunk, {
    httpOnly: true, expires: new Date(session.refreshExpiresAt * 1000), path: "/",
    sameSite: "lax", secure: config().secure,
  }));
}
