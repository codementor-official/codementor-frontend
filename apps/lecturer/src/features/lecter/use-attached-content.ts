"use client";

import { useCallback, useState } from "react";

/**
 * Nội dung mà giảng viên đính kèm vào tin nhắn kế tiếp gửi cho Lecter.
 *
 * Chỉ mang CON TRỎ (`kind`, `id`, `title`), không mang nội dung. Lecter đã có `read_exercise` và
 * `read_course` để tự đọc, nên chép nội dung vào đây chỉ đổi lấy hai thứ tệ hơn: một ảnh chụp cũ
 * ngay khi giảng viên sửa trong studio, và vài KB context mỗi lượt.
 *
 * Tham chiếu đi vào CHÍNH nội dung tin nhắn (xem `serialize`), không đi qua `useAgentContext`. Nhờ
 * vậy nó nằm trong lịch sử hội thoại đã lưu ở Mongo — mở lại trang vẫn còn — và người soạn nhìn
 * thấy đúng thứ mình vừa gửi thay vì một ngữ cảnh ẩn.
 */

export type AttachKind = "exercise" | "course";

export interface AttachedItem {
  kind: AttachKind;
  id: string;
  title: string;
}

export const ATTACH_LABELS: Record<AttachKind, string> = {
  exercise: "Bài code",
  course: "Khóa học",
};

export function useAttachedContent() {
  const [items, setItems] = useState<AttachedItem[]>([]);

  const attach = useCallback((item: AttachedItem) => {
    setItems((previous) =>
      previous.some((existing) => existing.id === item.id) ? previous : [...previous, item],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  /**
   * Phần ghép vào cuối tin nhắn. Id là thứ duy nhất Lecter thật sự cần; `title` đứng cạnh để
   * người soạn đọc lại lịch sử còn hiểu, và để model gọi đúng tool mà không phải đoán loại.
   */
  const serialize = useCallback(() => {
    if (items.length === 0) return "";
    return (
      "\n\n" +
      items
        .map((item) => `[Đính kèm] ${ATTACH_LABELS[item.kind]} "${item.title}" · id ${item.id}`)
        .join("\n")
    );
  }, [items]);

  return { items, attach, remove, clear, serialize };
}
