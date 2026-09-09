"use client";

import { useEffect, useRef, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/study-group/study-group-stats";
import { useCodey } from "./session-store";

/**
 * Lịch sử hội thoại dạng droplist — sidebar chỉ rộng bằng một cột, không có chỗ cho một rail.
 *
 * Danh sách trải trên MỌI bài, không lọc theo bài đang mở: học viên quay lại tìm "cái hôm qua
 * mình hỏi về two-pointer" chứ không nhớ nó thuộc bài nào. Nên mỗi dòng phải nói rõ bài của nó.
 */
export function CodeyHistoryMenu() {
  const { sessions, threadId, openSession, removeSession } = useCodey();
  const [open, setOpen] = useState(false);
  /** Mốc thời gian để tính "3 giờ trước". Chốt lúc MỞ droplist, không đọc `Date.now()` trong
   *  thân render: render phải thuần, và một giá trị đổi theo từng lượt vẽ làm React không so
   *  sánh được kết quả với chính nó. */
  const [openedAt, setOpenedAt] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        title="Lịch sử hội thoại"
        aria-label="Lịch sử hội thoại"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) setOpenedAt(Date.now());
          setOpen(!open);
        }}
        className={`flex size-7 items-center justify-center rounded-md transition-colors ${
          open ? "bg-primary-tint text-primary" : "text-text-muted hover:bg-bg hover:text-navy"
        }`}
      >
        <History aria-hidden="true" className="size-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-menu-in absolute top-full right-0 z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-dropdown"
        >
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-xs text-text-faint">Chưa có hội thoại nào.</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-1 rounded-md px-1 ${
                  session.id === threadId ? "bg-primary-tint/50" : ""
                }`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    openSession(session.id);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 px-1 py-2 text-left"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-2xs text-text-faint">{session.exerciseTitle}</span>
                    <span className="shrink-0 text-2xs text-text-faint">
                      {formatRelativeTime((openedAt - new Date(session.updatedAt).getTime()) / 60_000)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-navy">
                    {session.title}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Xoá hội thoại ${session.title}`}
                  onClick={() => removeSession(session.id)}
                  className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
