"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Trần chiều cao: quá mức này thì textarea tự cuộn, không đẩy khung chat ra khỏi màn hình. */
const MAX_HEIGHT = 160;

export function CodeyComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  /**
   * Tính lại chiều cao sau MỌI lần đổi giá trị, kể cả lần xoá trắng sau khi gửi.
   *
   * Phải đặt `height = "auto"` trước khi đọc `scrollHeight`: `scrollHeight` không bao giờ nhỏ
   * hơn chiều cao đang đặt, nên bỏ dòng đó thì ô nhập giữ nguyên độ cao của câu dài vừa gửi đi
   * và không co lại được nữa.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="shrink-0 border-t border-border-soft p-2.5">
      {/* Vòng tiêu điểm nằm trên chính textarea (luật nền ở globals.css), không giả lập bằng
          `focus-within` trên khung ngoài — khung ngoài không phải thứ nhận bàn phím. */}
      <div className="flex items-end gap-2 rounded-lg border border-border bg-bg px-2.5 py-2">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            // Bộ gõ tiếng Việt dựng từ bằng nhiều phím: Enter lúc đang ghép chữ là để CHỌN từ,
            // không phải để gửi. Không có hàng rào này thì gõ telex bị cắt giữa chừng.
            if (event.nativeEvent.isComposing) return;
            event.preventDefault();
            submit();
          }}
          placeholder="Hỏi Codey… (Shift+Enter để xuống dòng)"
          className="max-h-40 min-w-0 flex-1 resize-none rounded-sm bg-transparent text-xs leading-5 text-navy placeholder:text-text-faint disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Gửi câu hỏi cho Codey"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-on-ink transition-opacity hover:bg-primary-hover disabled:opacity-30"
        >
          <ArrowUp aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
