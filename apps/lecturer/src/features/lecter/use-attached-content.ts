"use client";

import { useCallback, useState } from "react";

/**
 * Nội dung mà giảng viên đính kèm vào tin nhắn kế tiếp gửi cho Lecter.
 *
 * Chỉ mang CON TRỎ (`kind`, `id`, `title`), không mang nội dung. Lecter đã có `read_exercise`,
 * `read_course` và `read_roadmap` để tự đọc, nên chép nội dung vào đây chỉ đổi lấy hai thứ tệ
 * hơn: một ảnh chụp cũ ngay khi giảng viên sửa trong studio, và vài KB context mỗi lượt.
 *
 * Tham chiếu đi vào CHÍNH nội dung tin nhắn (xem `serialize`), không đi qua `useAgentContext`. Nhờ
 * vậy nó nằm trong lịch sử hội thoại đã lưu ở Mongo — mở lại trang vẫn còn — và người soạn nhìn
 * thấy đúng thứ mình vừa gửi thay vì một ngữ cảnh ẩn.
 */

export type AttachKind = "exercise" | "course" | "roadmap" | "document";

export interface AttachedItem {
  kind: AttachKind;
  id: string;
  title: string;
  /**
   * Chỉ tài liệu mới có. Nội dung trong hệ thống thì Lecter đọc được ngay, còn một tệp vừa tải
   * lên phải qua trích văn bản và embedding trước đã — gửi sớm thì Lecter đọc ra rỗng rồi nói
   * sai với giảng viên, nên nút Gửi khoá cho tới khi mọi tệp `ready`.
   */
  state?: "uploading" | "indexing" | "ready" | "failed";
}

export const ATTACH_LABELS: Record<AttachKind, string> = {
  exercise: "Bài code",
  course: "Khóa học",
  roadmap: "Lộ trình",
  document: "Tài liệu",
};

/** Trần cho MỘT lượt gửi, gộp mọi loại — cùng con số `ai_document_max_files` phía backend. */
export const MAX_ATTACHMENTS = 4;

export function useAttachedContent() {
  const [items, setItems] = useState<AttachedItem[]>([]);

  /** Trả về `false` khi đã đủ trần, để nơi gọi báo cho người soạn thay vì im lặng bỏ qua. */
  const attach = useCallback((item: AttachedItem) => {
    let added = false;
    setItems((previous) => {
      if (previous.some((existing) => existing.id === item.id)) return previous;
      if (previous.length >= MAX_ATTACHMENTS) return previous;
      added = true;
      return [...previous, item];
    });
    return added;
  }, []);

  /** Cập nhật trạng thái xử lý của một tệp đang tải lên. */
  const update = useCallback((id: string, changes: Partial<AttachedItem>) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...changes } : item)),
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
    // Bỏ tệp tải hỏng. Id của nó vẫn là mã tạm do trình duyệt sinh — chưa bao giờ có bản ghi
    // nào phía sau — nên đưa vào tin nhắn là bảo Lecter đọc một tài liệu không tồn tại, và nó
    // sẽ báo "không tìm thấy" cho một tệp người soạn đang nhìn thấy trên màn hình.
    const usable = items.filter((item) => item.state !== "failed");
    if (usable.length === 0) return "";
    return (
      "\n\n" +
      usable
        .map((item) => `[Đính kèm] ${ATTACH_LABELS[item.kind]} "${item.title}" · id ${item.id}`)
        .join("\n")
    );
  }, [items]);

  return { items, attach, update, remove, clear, serialize };
}
