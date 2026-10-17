import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@codementor/auth";
import { safeHandoffPath, sealHandoff } from "@codementor/auth/handoff";
import { getAdminAuthConfig } from "@/features/auth/server/auth-config";
import { readSession, refreshAdminSession } from "@/features/auth/server/auth-session";

const CLIENT_URL = (process.env.NEXT_PUBLIC_CLIENT_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * "Super login": admin mở một trang của app học viên mà không phải đăng nhập lại ở đó.
 *
 * Form trong admin POST tới đây; server xin refresh token mới cho client, niêm phong thành
 * gói 60 giây (`@codementor/auth/handoff`) rồi trả một trang tự POST gói ấy sang
 * `/api/auth/handoff` của client — gói đi trong thân request, không nằm trên URL.
 */
export async function POST(request: NextRequest) {
  // Chỉ form của chính admin được kích hoạt, không phải một site khác nhúng form vào.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const path = safeHandoffPath(form?.get("path"));
  if (!path) return NextResponse.json({ message: "Đường dẫn không hợp lệ." }, { status: 400 });

  const session = await readSession(request);
  // Phiên đăng nhập qua trang Keycloak (`codementor-admin`) có refresh token mà client không
  // đổi được: mở trang thường, người dùng tự đăng nhập bên đó.
  if (!session || session.tokenClient !== "bff" || !hasRole(session.user, "admin")) {
    return NextResponse.redirect(`${CLIENT_URL}${path}`, 303);
  }

  let token: string;
  try {
    const fresh = await refreshAdminSession(session);
    token = await sealHandoff({ refreshToken: fresh.refreshToken, path }, getAdminAuthConfig().bffClientSecret);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Đang mở CodeMentor…</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem">
<form id="handoff" method="post" action="${escapeHtml(`${CLIENT_URL}/api/auth/handoff`)}">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<p>Đang đăng nhập vào CodeMentor bằng tài khoản quản trị…</p>
<noscript><button type="submit">Tiếp tục</button></noscript>
</form>
<script>document.getElementById("handoff").submit()</script>
</body></html>`;
  return new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
