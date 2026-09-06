import { api } from "@/lib/api";
import type { LecterAttachment } from "./types";

/** Trần cho MỘT lượt gửi — cùng con số `ai_document_max_files` phía ai-service. */
export const MAX_ATTACHMENTS = 4;

const POLL_MS = 2000;
/** Trần chờ. Một PDF 100 trang mất khoảng một phút; quá ba phút là có gì đó đã kẹt. */
const DEADLINE_MS = 180_000;

/**
 * Xếp hàng index rồi chờ tài liệu sẵn sàng.
 *
 * Xếp hàng ở TRÌNH DUYỆT, không phải trong tool của Lecter: đường `documents/prepare` đã có sẵn
 * và đã kiểm quyền, còn người soạn thì cần thấy ngay tệp mình vừa chọn đang được xử lý — chứ
 * không phải chờ đến lượt gửi mới biết là chưa đọc được.
 */
export async function prepareDocument(
  slug: string,
  id: string,
  signal: AbortSignal,
): Promise<LecterAttachment["state"]> {
  const deadline = Date.now() + DEADLINE_MS;
  const [first] = await api.ai.prepare(slug, [id]);
  let state = first?.state ?? "pending";
  for (;;) {
    if (state === "ready") return "ready";
    // `unsupported` cũng là hỏng: tệp không đọc được thì chờ thêm cũng vậy.
    if (state === "failed" || state === "unsupported") return "failed";
    if (Date.now() >= deadline) return "failed";
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", cancel);
        resolve();
      }, POLL_MS);
      signal.addEventListener("abort", cancel, { once: true });
    });
    signal.throwIfAborted();
    // Chỉ ĐỌC trạng thái, không xếp hàng lại: mỗi lần xếp hàng tiêu một suất hạn mức ngày.
    const [current] = await api.ai.documentStates(slug, [id]);
    state = current?.state ?? state;
  }
}

/**
 * Phần ghép vào cuối tin nhắn. Id là thứ duy nhất Lecter thật sự cần; tên đứng cạnh để người
 * soạn đọc lại lịch sử còn hiểu mình đã gửi gì.
 *
 * Tệp hỏng bị loại: id của nó vẫn tồn tại nhưng Lecter đọc ra rỗng, và nó sẽ báo "đang xử lý"
 * cho một tệp người soạn đang nhìn thấy là hỏng.
 */
export function serializeAttachments(items: LecterAttachment[]): string {
  const usable = items.filter((item) => item.state === "ready");
  if (usable.length === 0) return "";
  return (
    "\n\n" +
    usable.map((item) => `[Đính kèm] Tài liệu "${item.title}" · id ${item.id}`).join("\n")
  );
}
