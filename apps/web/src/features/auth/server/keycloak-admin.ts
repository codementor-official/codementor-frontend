import { getWebAuthConfig, keycloakRealmUrl } from "./auth-config";

/**
 * Tạo tài khoản trong Keycloak qua Admin REST API.
 *
 * Keycloak không có API tự đăng ký công khai — trang đăng ký của nó là một luồng
 * FreeMarker, không phải endpoint. Muốn giữ form đăng ký trong Next.js thì BFF phải tự
 * gọi Admin API bằng service account của `codementor-web-bff` (chỉ có `manage-users`).
 *
 * Mật khẩu vẫn KHÔNG được lưu ở phía CodeMentor: nó đi thẳng vào Keycloak trong đúng
 * một request rồi biến mất. Không có bảng người dùng thứ hai, không có kho mật khẩu thứ hai.
 */
export class EmailTakenError extends Error {
  constructor() {
    super("email_taken");
    this.name = "EmailTakenError";
  }
}

/** Keycloak từ chối mật khẩu vì chính sách của realm; thông điệp là của Keycloak. */
export class RejectedPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RejectedPasswordError";
  }
}

export async function createAccount(input: {
  displayName: string;
  email: string;
  password: string;
}): Promise<void> {
  const config = getWebAuthConfig();
  const token = await serviceAccountToken();

  const response = await fetch(`${config.internalKeycloakUrl}/admin/realms/${encodeURIComponent(config.realm)}/users`, {
    body: JSON.stringify({
      // Realm bật `registrationEmailAsUsername`, nên username chính là email.
      username: input.email,
      email: input.email,
      // Tên đầy đủ vào `firstName`: người Việt khai một ô "Họ và tên", còn claim `name`
      // của Keycloak được ghép từ firstName + lastName nên vẫn ra đúng chuỗi đã nhập.
      firstName: input.displayName,
      enabled: true,
      emailVerified: false,
      credentials: [{ type: "password", value: input.password, temporary: false }],
    }),
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    method: "POST",
  });

  if (response.status === 409) throw new EmailTakenError();
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { errorMessage?: string } | null;
    // 400 ở đây gần như luôn là chính sách mật khẩu của realm. Thông điệp của Keycloak
    // nói rõ thiếu gì, nên đưa thẳng cho người dùng thay vì nuốt đi.
    if (response.status === 400 && body?.errorMessage) {
      throw new RejectedPasswordError(body.errorMessage);
    }
    throw new Error(`Keycloak user creation failed with status ${response.status}`);
  }

  // Cố tình KHÔNG gán realm role: `default-roles-codementor` không chứa STUDENT, và cả
  // backend lẫn frontend đều quy một token không khớp role nào về `learner`. Tài khoản
  // tạo bằng Google/Facebook cũng đúng như vậy — thêm role ở đây sẽ khiến hai đường
  // đăng ký cho ra hai loại tài khoản khác nhau, và đòi service account thêm quyền
  // `view-realm` chỉ để đọc lại định nghĩa role.
}

async function serviceAccountToken(): Promise<string> {
  const config = getWebAuthConfig();
  const response = await fetch(`${keycloakRealmUrl(config)}/protocol/openid-connect/token`, {
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.bffClientId,
      client_secret: config.bffClientSecret,
    }),
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
  if (!response.ok) throw new Error(`Keycloak client credentials failed with ${response.status}`);
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}
