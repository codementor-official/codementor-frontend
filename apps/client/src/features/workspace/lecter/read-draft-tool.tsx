"use client";

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useLecterContext } from "./context";
import { draftSummary } from "./patch";
import { ToolRow } from "./tool-renderers";

/**
 * Cho Lecter đọc BIỂU MẪU đang mở trong studio.
 *
 * Bản nháp này chỉ tồn tại trong trình duyệt: người soạn tạo bài mới thì chưa có bản ghi nào ở
 * server, và ngay cả khi sửa bài đã đăng thì những gì họ vừa gõ cũng chưa lưu. Không có tool này,
 * `apply_exercise_draft` sửa từng phần trở thành vô nghĩa — Lecter không biết đang sửa cái gì nên
 * chỉ còn hai lối: hỏi người soạn chép tay đề bài vào khung chat, hoặc viết đè cả bài.
 *
 * Là tool phía TRÌNH DUYỆT chứ không phải `useAgentContext`: gửi cả biểu mẫu kèm mọi lượt chat
 * tốn vài KB cho những câu không liên quan tới nội dung, còn tool thì đọc đúng lúc cần và đọc ra
 * trạng thái ngay tại giây đó. Đổi lại nó hiện thành một dòng trong hội thoại — người soạn thấy
 * Lecter vừa đọc bài của mình, thay vì một ngữ cảnh ẩn.
 */
export function LecterReadDraftTool() {
  const { draft } = useLecterContext();

  // Handler đăng ký MỘT LẦN (deps `[]`) vì `useFrontendTool` gỡ rồi gắn lại tool mỗi khi deps
  // đổi, mà `draft` đổi theo từng phím gõ — đăng ký lại giữa lượt chạy làm huỷ tool đang chờ.
  // Ref là đường duy nhất để một handler bất biến đọc được bản nháp mới nhất.
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
  }, [draft]);

  useFrontendTool(
    {
      name: "read_exercise_draft",
      description:
        "Đọc nội dung BIỂU MẪU soạn bài người dùng đang mở (bản nháp chưa lưu). GỌI TRƯỚC khi " +
        "sửa, viết lại hay bổ sung bất cứ phần nào của bài đang có — không gọi thì bạn không " +
        "biết họ đang có gì và sẽ ghi đè mất. Không cần gọi khi soạn một bài hoàn toàn mới.",
      parameters: z.object({}),
      handler: async () => draftSummary(latest.current),
      render: ({ status, result }) => (
        <ToolRow
          icon={<FileText aria-hidden="true" className="size-3.5" />}
          label="Đọc biểu mẫu đang mở"
          status={status}
          detail={status === "complete" ? filled(result) : undefined}
        />
      ),
    },
    [],
  );

  return null;
}

/** Đọc được mấy phần — đủ để người soạn biết Lecter thấy bài của mình hay thấy form trống. */
function filled(result: string | undefined): string {
  if (!result) return "";
  const parts = result.match(/^## /gm)?.length ?? 0;
  return parts === 0 ? "Biểu mẫu đang trống" : `${parts} phần đang có nội dung`;
}
