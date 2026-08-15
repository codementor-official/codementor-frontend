const DEFAULT_REALM = "codementor";
const DEFAULT_CLIENT_ID = "codementor-admin";
const DEFAULT_AUDIENCE = "codementor-api";

export interface AdminAuthConfig {
  internalKeycloakUrl: string;
  realm: string;
  clientId: string;
  audience: string;
  sessionSecret: string;
  secureCookies: boolean;
}

export function getAdminAuthConfig(): AdminAuthConfig {
  const internalKeycloakUrl = stripTrailingSlash(
    process.env.KEYCLOAK_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_KEYCLOAK_URL ??
      "http://13.214.122.227:8080",
  );
  const sessionSecret = process.env.AUTH_SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters");
  }

  return {
    internalKeycloakUrl,
    realm: process.env.KEYCLOAK_REALM ?? process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? DEFAULT_REALM,
    clientId:
      process.env.KEYCLOAK_CLIENT_ID ??
      process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ??
      DEFAULT_CLIENT_ID,
    audience: process.env.KEYCLOAK_API_AUDIENCE ?? DEFAULT_AUDIENCE,
    sessionSecret,
    secureCookies: process.env.AUTH_COOKIE_SECURE === "true",
  };
}

export function keycloakRealmUrl(config: AdminAuthConfig): string {
  return `${config.internalKeycloakUrl}/realms/${encodeURIComponent(config.realm)}`;
}

export function publicKeycloakRealmUrl(origin: string, config: AdminAuthConfig): string {
  return `${origin}/auth/realms/${encodeURIComponent(config.realm)}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
