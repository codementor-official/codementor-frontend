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
