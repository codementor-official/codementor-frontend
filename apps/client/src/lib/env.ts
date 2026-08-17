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
 * codementor-backend/kong/kong.yml; this application never learns which service owns
 * which resource.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * realtime-service, gọi THẲNG chứ không qua Kong.
 *
 * Kong ở đây là gateway HTTP; đẩy WebSocket qua nó cần cấu hình upgrade riêng mà stack
 * hiện tại chưa có. Kết nối thẳng cũng đúng về mặt bản chất: đây là một kết nối sống
 * lâu, không phải request/response để mà cần rate limit hay retry của gateway.
 */
export const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3009";
