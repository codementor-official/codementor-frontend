import { createKeycloakPublicConfig } from "@codementor/auth";

/**
 * Every browser-safe variable this application reads. Next inlines
 * `process.env.NEXT_PUBLIC_*` only when the expression is written out literally, so
 * these cannot be looked up dynamically.
 */
export const keycloakConfig = createKeycloakPublicConfig({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "",
});

/** The Kong gateway. This application never learns which service owns which resource. */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
