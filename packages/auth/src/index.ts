import type { Role, User } from "@codementor/types";

export interface KeycloakTokenClaims {
  sub?: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  realm_access?: { roles?: string[] };
}

export function userFromToken(token: KeycloakTokenClaims | undefined): User | null {
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
