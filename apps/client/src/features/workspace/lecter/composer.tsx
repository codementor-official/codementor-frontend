"use client";

import type { KeyboardEvent } from "react";
import { FileText, Loader2, SendHorizonal, X } from "lucide-react";
import { LecterDocumentMenu } from "./document-menu";
import type { LecterAttachment } from "./sessions";

/**
 * Ô nhập của Lecter: chip tài liệu đính kèm, khung nhập, hàng công cụ và nút gửi.
 *
 * Dựng lại theo `CopilotChatInput` mà app giảng viên đang dùng để hai bên nhìn như một sản
 * phẩm: khối bo tròn 28px không viền, đổ bóng mảnh, ô gõ chiếm trọn hàng trên, còn nút `+`
 * và nút gửi nằm ở hàng công cụ bên dưới thay vì kẹp hai bên ô gõ.
 *
 * Enter gửi, Shift+Enter xuống dòng — quy ước của mọi khung chat, và người soạn hay dán đề
 * bài nhiều dòng vào đây.
 */
export function LecterComposer({
  slug,
  value,
  onChange,
  attachments,
  onAttachmentsChange,
  onSend,
  busy,
}: {
  slug: string;
  value: string;
  onChange: (value: string) => void;
  attachments: LecterAttachment[];
  onAttachmentsChange: (next: LecterAttachment[]) => void;
  onSend: () => void;
  busy: boolean;
}) {
  // Không có tài liệu thì Lecter không có gì để đọc: `generate-draft` đòi ít nhất một bản đã duyệt.
  const ready = value.trim().length > 0 && attachments.length > 0 && !busy;

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (ready) onSend();
  };

  return (
    <div className="w-full">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 px-2">
          {attachments.map((item) => (
            <span
              key={item.id}
              className="flex max-w-full items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2 py-1 text-xs"
            >
              <FileText aria-hidden="true" className="size-3.5 shrink-0 text-text-muted" />
              <span className="truncate text-navy">{item.title}</span>
              <button
                type="button"
                aria-label={`Bỏ đính kèm ${item.title}`}
                onClick={() =>
                  onAttachmentsChange(attachments.filter((entry) => entry.id !== item.id))
                }
                className="shrink-0 rounded text-text-muted hover:text-navy"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Vòng focus chuyển lên cả khối: ô gõ trong suốt nên một vòng riêng quanh nó sẽ cắt
          ngang giữa khung, đúng chỗ CopilotKit để trống. */}
      <div className="flex w-full flex-col rounded-[28px] bg-surface shadow-[0_4px_4px_0_#0000000a,0_0_1px_0_#0000009e] focus-within:ring-2 focus-within:ring-primary/40">
        <textarea
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          placeholder="Nhờ Lecter soạn bài từ tài liệu đã duyệt…"
          className="max-h-40 min-h-11 w-full resize-none bg-transparent px-5 pt-3.5 text-base leading-relaxed text-navy placeholder:text-text-faint focus-visible:outline-none"
        />

        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          <LecterDocumentMenu
            slug={slug}
            selected={attachments}
            onChange={onAttachmentsChange}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!ready}
            aria-label="Gửi cho Lecter"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-ink transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <SendHorizonal aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </div>

      <p className="mt-2 text-center text-2xs text-text-faint">
        Lecter có thể sai. Bản nháp vẫn cần bạn rà soát trước khi lưu.
      </p>
    </div>
  );
}
