"use client";

import { useEffect, useMemo } from "react";
import { useCopilotKit } from "@copilotkit/react-core/v2";
import { currentAccessToken } from "@/lib/api";

/**
 * Header của CopilotKit cho MỌI bề mặt agent của app học viên (Codey, Lecter nhóm, Trợ lý AI).
 *
 * Trước đây Codey và Lecter mỗi bên một bản chép của đúng hai thứ dưới đây; bản thứ ba cho Trợ lý
 * AI là lúc gom lại. Hai cái bẫy mà cả hai thứ này tồn tại để né đều không hiện ra lúc thử
 * nhanh, nên một bản chép lệch là một lỗi 401 chỉ nổ sau 5 phút.
 */

/** Trễ tối đa giữa lúc token được gia hạn và lúc CopilotKit biết. */
const TOKEN_SYNC_MS = 30_000;

/**
 * `null` với phiên đăng nhập bằng mật khẩu — token của họ nằm trong cookie HttpOnly và tầng Node
 * `/api/copilotkit` gắn hộ. Gửi `"Bearer "` rỗng thì tầng đó tưởng trình duyệt đã có token và
 * chuyển tiếp một header hỏng, nên ở đây phải là "không gửi gì cả".
 */
function bearer(): string | null {
  const token = currentAccessToken();
  return token ? `Bearer ${token}` : null;
}

function headersWith(extra: Record<string, string>): Record<string, string> {
  const token = bearer();
  return { ...(token ? { Authorization: token } : {}), ...extra };
}

function sameHeaders(left: Record<string, string>, right: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => left[key] === right[key]);
}

/**
 * Header ban đầu cho `<CopilotKitProvider headers>`.
 *
 * Bắt buộc, dù `AgentHeaderSync` đã tồn tại: effect của provider chạy SAU effect của con, gọi
 * `setHeaders(prop headers)` rồi `connect()` ngay trong đó. Không truyền prop này thì lượt
 * `/info` đầu tiên đi ra với header rỗng — phiên popup (token trong tab, không có cookie) nhận
 * 401, và mọi lượt chạy trong 30 giây đầu cũng vậy, tới khi vòng sync kịp gắn lại.
 *
 * Memo theo CHUỖI: đổi object mỗi lần render là provider chạy lại effect và reconnect.
 */
export function useAgentHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = JSON.stringify([bearer(), extra]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` là bản chuỗi của cả hai đầu vào
  return useMemo(() => headersWith(extra), [key]);
}

/**
 * Giữ header của CopilotKit đúng: token hiện hành, cộng header riêng của bề mặt.
 *
 * `AuthProvider` giữ token trong `useRef` và cố tình không re-render khi token được gia hạn
 * (~5 phút một lần), còn CopilotKit thì trải phẳng prop `headers` MỘT LẦN rồi giữ bản sao — nên
 * getter hay hàm đặt trong prop đó đều vô dụng, và không có cầu nối này thì sau ~5 phút mọi lượt
 * trả 401.
 *
 * So sánh với `copilotkit.headers` chứ không với một ref cục bộ: `CopilotKitProvider` cũng gọi
 * `setHeaders(mergedHeaders)` trong effect CỦA CHÍNH NÓ, mà effect của cha chạy SAU effect của
 * con — mọi giá trị đặt ở đây lúc mount đều bị nó ghi đè. Đọc lại trạng thái thật của core khiến
 * vòng này tự chữa.
 *
 * Đặt TRƯỚC mọi con khác trong provider: effect của con chạy theo thứ tự khai báo, và header
 * phải có sẵn trước lượt chạy đầu tiên.
 */
export function AgentHeaderSync({ extra = {} }: { extra?: Record<string, string> }) {
  const { copilotkit } = useCopilotKit();
  const key = JSON.stringify(extra);

  useEffect(() => {
    const wanted = JSON.parse(key) as Record<string, string>;
    const apply = () => {
      const next = headersWith(wanted);
      if (!sameHeaders(copilotkit.headers ?? {}, next)) copilotkit.setHeaders(next);
    };
    apply();
    const timer = setInterval(apply, TOKEN_SYNC_MS);
    return () => clearInterval(timer);
  }, [copilotkit, key]);

  return null;
}
