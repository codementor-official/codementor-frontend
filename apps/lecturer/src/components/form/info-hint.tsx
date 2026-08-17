import { Info } from "lucide-react";

/**
 * Dấu hỏi bên cạnh một nhãn: rê chuột (hoặc tab tới) mới hiện lời giải thích.
 *
 * Trước đây mỗi trường và mỗi thẻ đều in kèm một dòng mô tả xám. Một form mười trường vì
 * thế dài gấp đôi, và người soạn đến lần thứ hai đã không đọc nữa — chữ luôn hiện là chữ
 * bị bỏ qua. Ở đây lời giải thích vẫn còn nguyên, chỉ là hiện khi được hỏi.
 *
 * `tabIndex` trên một `<span>` chứ không phải `<button>`: mấy chỗ này nằm trong
 * `<fieldset disabled>` khi bài đang chờ duyệt, mà nút trong fieldset bị vô hiệu là mất
 * luôn đường vào bằng bàn phím.
 */
export function InfoHint({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`group relative inline-flex align-middle ${className}`}>
      <span
        aria-label={text}
        className="flex cursor-help items-center text-muted-foreground hover:text-foreground focus-visible:text-foreground"
        role="note"
        tabIndex={0}
      >
        <Info aria-hidden="true" className="size-3.5" />
      </span>
      {/* Mở xuống dưới chứ không lên trên: các form này nằm trong pane cuộn, và mép trên
          của pane hay đúng chỗ nhãn đầu tiên đứng. */}
      <span
        className="pointer-events-none invisible absolute top-full left-0 z-30 mt-1.5 w-64 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-relaxed font-normal text-popover-foreground opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}
