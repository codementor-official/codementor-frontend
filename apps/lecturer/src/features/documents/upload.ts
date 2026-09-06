import { api } from "@/lib/api";
import type { AiDocument } from "./types";

/**
 * Tải tài liệu lên và chờ nó xử lý xong.
 *
 * Ba chặng, và chặng giữa KHÔNG đi qua backend: trình duyệt `PUT` thẳng lên kho bằng URL đã ký.
 * ai-service chặn body quá 2 MB cho mọi đường `/api/v1/ai/*`, và đẩy 20 MB qua Kong rồi qua
 * Uvicorn chỉ để rơi vào S3 là ba chặng thừa.
 *
 *   presign  ->  PUT thẳng S3  ->  register (backend tự HeadObject xác nhận rồi xếp hàng index)
 */

/** Header phải gửi ĐÚNG như lúc ký — `Content-Type` và `Content-Length` nằm trong chữ ký. */
async function put(uploadUrl: string, headers: Record<string, string>, file: File) {
  // `Content-Length` là forbidden header name: trình duyệt tự đặt nó từ body và bỏ qua giá trị
  // gửi tay. Nó vẫn nằm trong chữ ký phía S3, và giá trị trình duyệt đặt đúng bằng kích thước
  // tệp đã xin ký — nên bỏ khỏi đây là đúng, không phải lách.
  const sendable = Object.fromEntries(
    Object.entries(headers).filter(([name]) => name.toLowerCase() !== "content-length"),
  );
  const response = await fetch(uploadUrl, { method: "PUT", headers: sendable, body: file });
  if (!response.ok) {
    throw new Error(`Không tải được tệp lên kho (mã ${response.status}). Thử lại giúp mình.`);
  }
}

export async function uploadDocument(file: File): Promise<AiDocument> {
  const signed = await api.aiDocuments.presign({ filename: file.name, sizeBytes: file.size });
  await put(signed.uploadUrl, signed.headers, file);
  return api.aiDocuments.register({ objectKey: signed.objectKey, filename: file.name });
}

const POLL_MS = 2000;
/** Trần chờ. Một PDF 100 trang mất khoảng một phút; quá ba phút là có gì đó đã kẹt. */
const DEADLINE_MS = 180_000;

/**
 * Chờ tới khi tài liệu xử lý xong.
 *
 * Chỉ ĐỌC trạng thái, không bao giờ tự xếp hàng lại: một tệp hỏng mà cứ thử lại trong vòng lặp
 * thì mỗi vòng tiêu một suất hạn mức ngày của người soạn. Muốn chạy lại thì có nút "Xử lý lại".
 */
export async function waitForReady(
  id: string,
  signal: AbortSignal,
  onState?: (document: AiDocument) => void,
): Promise<AiDocument> {
  const deadline = Date.now() + DEADLINE_MS;
  for (;;) {
    signal.throwIfAborted();
    const current = await api.aiDocuments.get(id);
    onState?.(current);
    if (current.state === "ready") return current;
    if (current.state === "failed" || current.state === "unsupported") {
      throw new Error(current.error || "Không đọc được tài liệu này.");
    }
    if (Date.now() >= deadline) {
      throw new Error(
        "Tài liệu vẫn đang được xử lý. Mở trang Tài liệu để theo dõi rồi đính kèm lại sau.",
      );
    }
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
  }
}
