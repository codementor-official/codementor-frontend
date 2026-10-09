/**
 * Câu lỗi người đọc được từ một lượt agent hỏng.
 *
 * Lỗi HTTP trước khi stream mở (cổng quyền, hạn mức ngày, tài liệu hỏng) tới đây dưới dạng
 * `HTTP 400: {"message":"Tài liệu không tồn tại…"}` — câu tiếng Việt server đã viết sẵn nằm gọn
 * trong JSON. Hiện nguyên chuỗi thì người dùng đọc một dòng giao thức; vứt đi thì mất đúng câu
 * giải thích họ cần.
 */
const FALLBACK = "Lượt này hỏng giữa chừng. Thử lại giúp mình.";

export function agentErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error ?? "");
  const json = text.match(/\{[\s\S]*\}/);
  if (json) {
    try {
      const body = JSON.parse(json[0]) as { message?: unknown; detail?: unknown };
      const message = body.message ?? body.detail;
      if (typeof message === "string" && message.trim()) return message;
    } catch {
      // Không phải JSON hợp lệ: rơi xuống các nhánh dưới.
    }
  }
  if (/^HTTP 401\b/.test(text)) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (!text || /^HTTP \d{3}\b/.test(text)) return FALLBACK;
  return text;
}
