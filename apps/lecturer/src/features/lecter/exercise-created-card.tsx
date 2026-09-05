"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge, buttonClassName } from "@codementor/ui";
import { STATUS_LABELS, STATUS_TONES, type ExerciseStatus } from "@codementor/solve";

/**
 * Kết quả của một lệnh ghi đã áp dụng, dạng thẻ có đường đi tiếp.
 *
 * Trước đây chỗ này là một dòng xám "Đã áp dụng: …" rồi người soạn phải tự mở danh sách bài đi
 * tìm. Bài vừa tạo thì Lecter biết id, nên chat đưa thẳng nút sang studio được.
 *
 * Ba ràng buộc của thẻ này, mỗi cái có lý do:
 *
 * - **Ảnh chụp, không đồng bộ.** Số test case ghi ở đây là số lúc lưu. Sửa trong studio xong quay
 *   lại chat thì con số cũ vẫn đứng nguyên, và đó là đúng: đây là lịch sử hội thoại, không phải
 *   một bảng điều khiển. Đồng bộ ngược lại nghĩa là mỗi thẻ cũ là một request mỗi lần mở hội
 *   thoại — đúng thứ vừa bỏ đi ở `SettledProposal`.
 * - **Route do frontend dựng từ id.** Model không bao giờ sinh URL; nó chỉ trả danh tính tài
 *   nguyên. Trang khác trong app cũng viết thẳng như vậy (`exercises/page.tsx:500`).
 * - **Không tự điều hướng.** Agent có thể đang chạy tiếp, và người soạn có thể muốn xem hết rồi
 *   mới mở. Bấm nút là hành động của họ.
 */
export function ExerciseCreatedCard({
  title,
  exerciseId,
  lines,
  status,
}: {
  title: string;
  exerciseId: string;
  lines?: string[];
  /** Chỉ đặt khi BIẾT chắc, đừng đoán: bài đã công khai mà gắn nhãn "Nháp" là nói sai. */
  status?: ExerciseStatus;
}) {
  return (
    <section className="my-2 rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-sm font-semibold">{title}</h3>
        {status && (
          <span className="shrink-0">
            <StatusBadge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</StatusBadge>
          </span>
        )}
      </div>

      {lines && lines.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex justify-end">
        <Link className={buttonClassName()} href={`/exercises/${exerciseId}/studio`}>
          Mở Studio
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
