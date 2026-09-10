"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    /* Khuôn của composer chat trong repo (`workspace-chat.tsx`): chính textarea là ô có viền,
       nút gửi đứng cạnh. Trước đây tôi bọc cả hai trong một khung có viền nữa — thành ra vòng
       tiêu điểm của textarea vẽ một hộp cam LỒNG trong hộp xám, trông như báo lỗi. */
    <div className="shrink-0 border-t border-border-soft bg-surface p-2.5">
      <div className="flex items-end gap-2">
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
          placeholder="Hỏi Codey…"
          className="max-h-40 min-h-9 min-w-0 flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-xs leading-5 text-navy placeholder:text-text-faint focus:border-primary disabled:opacity-60"
        />
        <Button
          size="sm"
          aria-label="Gửi câu hỏi cho Codey"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="size-9 shrink-0 !px-0"
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {/* Hai câu này ra khỏi placeholder: placeholder dài bị cắt ngay khi ô hẹp lại, và câu thứ
          hai là thứ người học cần đọc TRƯỚC khi gõ, không phải thứ biến mất lúc bắt đầu gõ. */}
      <p className="mt-1.5 px-0.5 text-2xs leading-4 text-text-faint">
        <kbd className="rounded border border-border px-1 font-sans">Shift</kbd>
        <span aria-hidden="true"> + </span>
        <kbd className="rounded border border-border px-1 font-sans">Enter</kbd> để xuống dòng ·
        Codey gợi ý hướng, không đưa lời giải hoàn chỉnh.
      </p>
    </div>
  );
}
