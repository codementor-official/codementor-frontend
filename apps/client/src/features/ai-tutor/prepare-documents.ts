import { api } from "@/lib/api";

/** Prepare the explicit selection once; polling must never retry failed jobs. */
export async function prepareDocuments(
  slug: string,
  ids: string[],
  signal: AbortSignal,
  onProgress: (ready: number, total: number) => void,
) {
  signal.throwIfAborted();
  let states = await api.ai.prepare(slug, ids);
  const deadline = Date.now() + 180_000;
  while (true) {
    signal.throwIfAborted();
    if (
      states.length !== ids.length ||
      ids.some((id) => !states.some((item) => item.id === id))
    )
      throw new Error(
        "Không kiểm tra được đủ tài liệu đã chọn. Vui lòng thử lại.",
      );
    const failed = states.find(
      (item) => item.state === "failed" || item.state === "unsupported",
    );
    if (failed)
      throw new Error(
        failed.error ||
          "Không đọc được tài liệu đã chọn. Hãy kiểm tra tệp trong nhóm.",
      );
    const ready = states.filter((item) => item.state === "ready").length;
    onProgress(ready, ids.length);
    if (ready === ids.length) return;
    if (Date.now() >= deadline)
      throw new Error(
        "Tài liệu vẫn đang được chuẩn bị. Bạn có thể quay lại gửi câu hỏi sau ít phút.",
      );
    await new Promise<void>((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", cancel);
        resolve();
      }, 2500);
      signal.addEventListener("abort", cancel, { once: true });
    });
    signal.throwIfAborted();
    states = await api.ai.documentStates(slug, ids);
  }
}
