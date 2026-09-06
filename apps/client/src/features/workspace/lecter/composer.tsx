"use client";

import type { KeyboardEvent } from "react";
import { FileText, Loader2, SendHorizonal, X } from "lucide-react";
import { LecterDocumentMenu } from "./document-menu";
import type { LecterAttachment } from "./sessions";

/**
 * Ô nhập của Lecter: chip tài liệu đính kèm, menu import, ô gõ và nút gửi.
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
        <div className="mb-2 flex flex-wrap gap-1.5">
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

      <div className="flex items-end gap-1.5 rounded-xl border border-border bg-surface p-1.5">
        <LecterDocumentMenu
          slug={slug}
          selected={attachments}
          onChange={onAttachmentsChange}
        />
        <textarea
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={keyDown}
          placeholder="Nhờ Lecter soạn bài từ tài liệu đã duyệt…"
          className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-navy placeholder:text-text-faint"
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

      <p className="mt-1.5 px-1 text-2xs text-text-faint">
        {attachments.length === 0
          ? "Chọn ít nhất một tài liệu đã duyệt bằng nút +."
          : "Lecter có thể sai. Bản nháp vẫn cần bạn rà soát trước khi lưu."}
      </p>
    </div>
  );
}
