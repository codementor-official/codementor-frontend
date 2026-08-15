import { createKeycloakPublicConfig } from "@codementor/auth";

/**
 * Every browser-safe variable this application reads, in one place. Next.js inlines
 * `process.env.NEXT_PUBLIC_*` at build time only when the full expression is written
 * out literally, so these cannot be looked up dynamically.
 */
export const keycloakConfig = createKeycloakPublicConfig({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "",
});

/**
 * The Kong gateway, not a service port. Routing lives in
 * codementor-backend/kong/kong.yml; this application never learns which service
 * owns which resource.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Whether to offer self-service registration. The authoritative switch is the
 * Keycloak realm setting `registrationAllowed`; turning that off blocks sign-up at
 * the source. This flag only decides whether the application shows a link that
 * would otherwise lead to a rejection.
 */
export const selfSignupEnabled = process.env.NEXT_PUBLIC_LECTURER_SELF_SIGNUP !== "false";
