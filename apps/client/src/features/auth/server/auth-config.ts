/**
 * Cấu hình chỉ tồn tại phía server cho BFF đăng nhập bằng mật khẩu.
 *
 * KHÔNG có biến nào ở đây mang tiền tố `NEXT_PUBLIC_`: Next chỉ nhúng biến môi trường
 * vào bundle trình duyệt khi tên bắt đầu bằng tiền tố đó, nên client secret của Keycloak
 * không có đường nào ra tới client. File này chỉ được import từ route handler.
 */
const DEFAULT_REALM = "codementor";
const DEFAULT_BFF_CLIENT_ID = "codementor-web-bff";
const DEFAULT_AUDIENCE = "codementor-api";

export interface WebAuthConfig {
  internalKeycloakUrl: string;
  realm: string;
  /**
   * Client bí mật, RIÊNG cho BFF. Không phải `codementor-web` — client công khai mà
   * trình duyệt dùng cho luồng popup Google/Facebook vẫn tắt Direct Access Grant.
   */
  bffClientId: string;
  bffClientSecret: string;
  audience: string;
  sessionSecret: string;
  secureCookies: boolean;
}

export function getWebAuthConfig(): WebAuthConfig {
  const sessionSecret = process.env.AUTH_SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters");
  }
  const bffClientSecret = process.env.KEYCLOAK_BFF_CLIENT_SECRET;
  if (!bffClientSecret) {
    throw new Error("KEYCLOAK_BFF_CLIENT_SECRET is not configured");
  }

  return {
    internalKeycloakUrl: stripTrailingSlash(
      process.env.KEYCLOAK_INTERNAL_URL ??
        process.env.NEXT_PUBLIC_KEYCLOAK_URL ??
        "https://id.codementor.cloud",
    ),
    realm: process.env.KEYCLOAK_REALM ?? process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? DEFAULT_REALM,
    bffClientId: process.env.KEYCLOAK_BFF_CLIENT_ID ?? DEFAULT_BFF_CLIENT_ID,
    bffClientSecret,
    audience: process.env.KEYCLOAK_API_AUDIENCE ?? DEFAULT_AUDIENCE,
    sessionSecret,
    // Cookie phiên chỉ được gửi qua HTTPS ở production. Xem thêm `requireSecureTransport`
    // trong route đăng nhập: mật khẩu không được phép đi qua HTTP ngoài môi trường dev.
    secureCookies: process.env.AUTH_COOKIE_SECURE === "true",
  };
}

export function keycloakRealmUrl(config: WebAuthConfig): string {
  return `${config.internalKeycloakUrl}/realms/${encodeURIComponent(config.realm)}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
