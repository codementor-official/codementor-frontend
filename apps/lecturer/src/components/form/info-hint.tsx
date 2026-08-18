"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

/** Bề rộng tối đa của bảng chú thích, và khoảng chừa hai mép màn hình. */
const WIDTH = 256;
const EDGE = 8;

/**
 * Dấu hỏi bên cạnh một nhãn: rê chuột (hoặc tab tới) mới hiện lời giải thích.
 *
 * Trước đây mỗi trường và mỗi thẻ đều in kèm một dòng mô tả xám. Một form mười trường vì
 * thế dài gấp đôi, và người soạn đến lần thứ hai đã không đọc nữa — chữ luôn hiện là chữ
 * bị bỏ qua. Ở đây lời giải thích vẫn còn nguyên, chỉ là hiện khi được hỏi.
 *
 * Bảng chú thích vẽ ở `document.body` theo toạ độ màn hình, KHÔNG phải một `absolute` nằm
 * cạnh cái nút. Nó từng là như vậy, và một hộp rộng 256px neo bên trong pane cuộn của
 * studio làm pane đó mọc thanh cuộn NGANG — vùng cuộn tính cả phần tử absolute, kể cả khi
 * nó đang ẩn. Cùng lý do khiến chú thích ở mép phải bị cắt mất một nửa. Vẽ ở body thì nó
 * không thuộc vùng cuộn của ai cả.
 *
 * `tabIndex` trên một `<span>` chứ không phải `<button>`: mấy chỗ này nằm trong
 * `<fieldset disabled>` khi bài đang chờ duyệt, mà nút trong fieldset bị vô hiệu là mất
 * luôn đường vào bằng bàn phím.
 */
export function InfoHint({ text, className = "" }: { text: string; className?: string }) {
  const trigger = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Đo lúc mở, một lần. Không theo dõi cuộn: chú thích chỉ sống trong lúc con trỏ còn
  // nằm trên dấu hỏi, mà cuộn thì con trỏ rời đi và nó đóng lại.
  const open = () => {
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return;
    setPosition({
      top: anchor.bottom + 6,
      left: Math.min(
        Math.max(EDGE, anchor.left),
        Math.max(EDGE, window.innerWidth - WIDTH - EDGE),
      ),
    });
  };
  const close = () => setPosition(null);

  return (
    <span className={`inline-flex align-middle ${className}`}>
      <span
        aria-label={text}
        className="flex cursor-help items-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
        onBlur={close}
        onFocus={open}
        onPointerEnter={open}
        onPointerLeave={close}
        ref={trigger}
        role="note"
        tabIndex={0}
      >
        <Info aria-hidden="true" className="size-3.5" />
      </span>

      {position !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[70] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-relaxed font-normal text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            role="tooltip"
            style={{ top: position.top, left: position.left, width: WIDTH }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
