import { User as OidcUser, UserManager, WebStorageStateStore } from "oidc-client-ts";
import type { Role, User } from "@codementor/types";

export interface KeycloakPublicConfig {
  url: string;
  realm: string;
  clientId: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: number;
}

/**
 * Danh tính suy ra từ claim của token Keycloak.
 *
 * Dùng ở BFF của apps/admin, nơi token được đọc phía server và không bao giờ ra tới
 * trình duyệt. Trả về đúng hình dạng `User` mà backend trả từ `GET /api/v1/me`, để cả
 * hệ thống chỉ có một khái niệm "người dùng đang đăng nhập".
 *
 * `id` ở đây là `sub` của Keycloak, KHÔNG phải `users.id` nội bộ — chỉ đủ để hiển thị
 * và kiểm vai trò. Chỗ nào cần so quyền sở hữu thì phải lấy hồ sơ từ `/api/v1/me`.
 */
export function userFromToken(token: KeycloakTokenClaims | undefined): User | null {
  if (!token?.sub) return null;
  return {
    id: token.sub,
    email: token.email ?? "",
    displayName: token.name ?? token.preferred_username ?? token.email ?? token.sub,
    role: platformRoleOf(token.realm_access?.roles ?? []),
  };
}

export interface KeycloakTokenClaims {
  sub?: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  realm_access?: { roles?: string[] };
}

/** Xếp từ quyền cao xuống thấp. Ai có nhiều vai trò thì lấy cái cao nhất. */
const ROLE_PRECEDENCE: readonly Role[] = ["admin", "lecturer", "learner"];

/**
 * Tên realm role → vai trò nền tảng, đúng bảng ánh xạ mà backend dùng ở
 * `libs/platform/src/auth/jwt-payload.ts`.
 *
 * Realm mang hai cách đặt tên song song: `learner`/`lecturer`/`admin` từ bản import đầu
 * và `STUDENT`/`LECTURER`/`ADMIN` từ đợt cấu hình sau. Từ vựng nội bộ giữ chữ thường vì
 * đó là giá trị của enum `platform_role` trong PostgreSQL.
 */
const ROLE_ALIASES: Record<string, Role> = {
  admin: "admin",
  lecturer: "lecturer",
  learner: "learner",
  student: "learner",
};

export function platformRoleOf(realmRoles: readonly string[]): Role {
  const granted = new Set<Role>();
  for (const name of realmRoles) {
    const mapped = ROLE_ALIASES[name.toLowerCase()];
    if (mapped) granted.add(mapped);
  }
  return ROLE_PRECEDENCE.find((role) => granted.has(role)) ?? "learner";
}

export function hasRole(user: Pick<User, "role"> | null | undefined, role: Role): boolean {
  return user?.role === role;
}

export function hasAnyRole(
  user: Pick<User, "role"> | null | undefined,
  roles: readonly Role[],
): boolean {
  return roles.some((role) => hasRole(user, role));
}

export function createKeycloakPublicConfig(config: KeycloakPublicConfig): KeycloakPublicConfig {
  for (const [key, value] of Object.entries(config)) {
    if (!value.trim()) {
      throw new Error("Missing Keycloak public configuration: " + key);
    }
  }
  return config;
}

function realmUrl(config: KeycloakPublicConfig): string {
  return config.url.replace(/\/$/, "") + "/realms/" + config.realm;
}

/**
 * Authorization code flow with PKCE, which is the only browser-safe flow for a
 * public client — there is no secret to protect, so the code verifier is what
 * stops an intercepted authorization code from being redeemed by someone else.
 *
 * Tokens are held in memory. `WebStorageStateStore` on sessionStorage covers only
 * the short-lived state and PKCE verifier during the redirect, which has to
 * survive a full page navigation and cannot live in memory. Access tokens in
 * localStorage would be readable by any script the page ever loads.
 */
let sharedUserManager: UserManager | null = null;

/**
 * One UserManager per browser tab, deliberately.
 *
 * Its `userLoaded` / `userUnloaded` events are per instance. A second instance
 * created by the redirect callback page would store the tokens and fire its events
 * into the void, leaving the provider that renders the application still believing
 * nobody is signed in — the session appears only after a full page reload. Two
 * instances would also run two silent-renew timers against the same session.
 */
export function getUserManager(config: KeycloakPublicConfig, redirectOrigin: string): UserManager {
  sharedUserManager ??= createUserManager(config, redirectOrigin);
  return sharedUserManager;
}

function createUserManager(config: KeycloakPublicConfig, redirectOrigin: string) {
  return new UserManager({
    authority: realmUrl(config),
    client_id: config.clientId,
    redirect_uri: redirectOrigin + "/auth/callback",
    post_logout_redirect_uri: redirectOrigin + "/login",
    response_type: "code",
    scope: "openid profile email",
    // Renew through a hidden iframe before expiry, so a lecturer editing a long
    // form does not lose the session mid-edit.
    automaticSilentRenew: true,
    silent_redirect_uri: redirectOrigin + "/auth/silent-renew",
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    monitorSession: false,
  });
}

/**
 * Keycloak's own registration page. Self-service sign-up is a realm setting
 * (`registrationAllowed`), so this link is dead when an administrator turns it
 * off — the flag in the application only decides whether to show it.
 */
export function registrationUrl(config: KeycloakPublicConfig, redirectOrigin: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: redirectOrigin + "/auth/callback",
    // Same reasoning as `signIn`'s prompt=login: without it, a still-alive Keycloak
    // SSO session skips straight past the registration form as an existing user.
    prompt: "login",
  });
  return realmUrl(config) + "/protocol/openid-connect/registrations?" + params.toString();
}

/** Keycloak account console — where a user changes password, email, or 2FA. */
export function accountConsoleUrl(config: KeycloakPublicConfig): string {
  return realmUrl(config) + "/account";
}

export function accessTokenOf(oidcUser: OidcUser | null): string | null {
  if (!oidcUser || oidcUser.expired) return null;
  return oidcUser.access_token;
}

// Re-exported so applications never import oidc-client-ts directly. The choice of
// OIDC library stays an implementation detail of this package; swapping it would
// otherwise mean editing every consumer.
export type { OidcUser, UserManager };
