"use client";

import { useEffect } from "react";

export interface StoredDraft<T> {
  value: T;
  savedAt: number;
}

/**
 * `kind` phân biệt loại bản nháp, không phải ứng dụng: mỗi app chạy ở origin riêng nên
 * localStorage đã tách sẵn, thêm tên app vào khoá chỉ là chữ thừa.
 */
export function draftStorageKey(kind: string, id: string): string {
  return `codementor:${kind}-draft:${id}`;
}

/**
 * Khôi phục nháp là tiện ích thêm, không phải đường lưu chính — hỏng ở bất kỳ bước nào (hết
 * dung lượng, trình duyệt chặn localStorage, tab ẩn danh) chỉ có nghĩa là không khôi phục
 * được, đường "Lưu" ở đầu trang vẫn hoạt động bình thường.
 */
export function readDraft<T>(storageKey: string): StoredDraft<T> | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Một bản nháp có shape cũ (từ trước nhánh này, phẳng {meta, chapters, savedAt}) vẫn là
    // JSON hợp lệ nhưng thiếu `.value` — phải chặn ở đây, không thì gọi `.value.meta` ở nơi
    // đọc sẽ ném lỗi bị `.catch` nuốt mất, và người dùng mất nháp cũ mà không biết vì sao.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "value" in parsed &&
      "savedAt" in parsed &&
      typeof (parsed as { savedAt: unknown }).savedAt === "number"
    ) {
      return parsed as StoredDraft<T>;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(storageKey: string, value: T): void {
  try {
    const draft: StoredDraft<T> = { value, savedAt: Date.now() };
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // ignore — xem readDraft
  }
}

export function clearDraft(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore — xem readDraft
  }
}

/**
 * Ghi nháp mỗi khi có thay đổi chưa lưu, xoá khi khớp lại bản đã lưu. `ready` giữ hook im
 * lặng trước khi bản ghi gốc tải xong — nếu không, lần render đầu (current rỗng) sẽ xoá mất
 * một bản nháp hợp lệ trước khi effect đọc nó kịp. Đủ nhanh cho một bản nháp cỡ vài chục
 * trường — không cần debounce cho `localStorage.setItem` ở quy mô này.
 */
export function useDraftAutosave<T>(
  storageKey: string,
  current: T,
  opts: { ready: boolean; dirty: boolean },
): void {
  useEffect(() => {
    if (!opts.ready) return;
    if (opts.dirty) writeDraft(storageKey, current);
    else clearDraft(storageKey);
  }, [storageKey, current, opts.ready, opts.dirty]);
}
