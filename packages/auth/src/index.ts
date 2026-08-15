import type { Role, User } from "@codementor/types";
import Keycloak, { type KeycloakTokenParsed } from "keycloak-js";

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

export type KeycloakClient = Keycloak;

export function createKeycloakClient(config: KeycloakPublicConfig): KeycloakClient {
  return new Keycloak(createKeycloakPublicConfig(config));
}

export function userFromToken(token: KeycloakTokenParsed | undefined): User | null {
  if (!token?.sub || !token.preferred_username) return null;
  const allowed = new Set<Role>(["STUDENT", "LECTURER", "ADMIN", "AI_AGENT"]);
  const roles = (token.realm_access?.roles ?? []).filter((role): role is Role =>
    allowed.has(role as Role),
  );
  return {
    id: token.sub,
    username: token.preferred_username,
    email: token.email,
    displayName: token.name ?? token.preferred_username,
    roles,
  };
}

export function hasRole(user: Pick<User, "roles"> | null | undefined, role: Role): boolean {
  return user?.roles.includes(role) ?? false;
}

export function hasAnyRole(
  user: Pick<User, "roles"> | null | undefined,
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
