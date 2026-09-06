"use client";

import { useEffect, useRef, useState } from "react";
import { History, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SideDrawer, useToast } from "@codementor/ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { messageOf } from "../exercise-authoring";
import { LecterComposer } from "./composer";
import {
  newSession,
  readSessions,
  sessionTitle,
  writeSessions,
  type LecterAttachment,
  type LecterDraft,
  type LecterMessage,
  type LecterSession,
} from "./sessions";

/** Danh sách hội thoại cũ dưới dạng droplist, không phải một cột rail: drawer chỉ rộng bằng một cột. */
function HistoryMenu({
  sessions,
  activeId,
  onPick,
  onRemove,
}: {
  sessions: LecterSession[];
  activeId: string;
  onPick: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
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
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <History aria-hidden="true" className="size-3.5" />
        Lịch sử
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          {sessions.length === 0 && (
            <p className="px-2 py-3 text-xs text-text-faint">Chưa có hội thoại nào.</p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-1 rounded-md px-1 ${session.id === activeId ? "bg-primary/5" : ""}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onPick(session.id);
                  setOpen(false);
                }}
                className="min-w-0 flex-1 px-1 py-2 text-left"
              >
                <span className="block truncate text-xs font-medium text-navy">
                  {session.title}
                </span>
                <span className="block text-2xs text-text-faint">
                  {new Date(session.updatedAt).toLocaleString("vi-VN")}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Xoá hội thoại ${session.title}`}
                onClick={() => onRemove(session.id)}
                className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  draft,
  onApply,
}: {
  draft: LecterDraft;
  onApply: (draft: LecterDraft) => void;
}) {
  const statement = String(draft.content.statement ?? "");
  return (
    <div className="mt-2 rounded-lg border border-border-soft bg-surface p-3">
      <p className="text-sm font-semibold text-navy">{draft.title}</p>
      <p className="mt-1 text-xs text-text-muted">{draft.summary}</p>
      {statement && (
        <div className="rich-text mt-2 max-h-48 overflow-y-auto border-t border-border-soft pt-2 text-xs leading-6">
          <ReactMarkdown>{statement}</ReactMarkdown>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {draft.sourceDocuments.map((document) => (
          <span
            key={document.id}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary"
          >
            {document.title}
          </span>
        ))}
      </div>
      <Button size="sm" className="mt-3" onClick={() => onApply(draft)}>
        Đưa vào form soạn bài
      </Button>
    </div>
  );
}

function MessageRow({
  message,
  onApply,
}: {
  message: LecterMessage;
  onApply: (draft: LecterDraft) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/10 px-3 py-2">
          <p className="whitespace-pre-wrap text-sm text-navy">{message.text}</p>
          {message.attachments && message.attachments.length > 0 && (
            <p className="mt-1 text-2xs text-text-muted">
              {message.attachments.map((item) => item.title).join(" · ")}
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[95%]">
      <p className={`text-sm ${message.failed ? "text-danger" : "text-navy"}`}>{message.text}</p>
      {message.draft && <DraftCard draft={message.draft} onApply={onApply} />}
    </div>
  );
}

/**
 * Chat với Lecter ngay trong Studio bài tập, thay cho hộp thoại "AI từ tài liệu" cũ.
 *
 * Hộp thoại cũ là một lần bắn: chọn tài liệu, gõ prompt, nhận bản nháp, hết. Không sửa lại
 * được yêu cầu mà không mất kết quả vừa xem, và không có gì lưu lại. Drawer giữ nguyên form
 * soạn bài phía sau, nên bản nháp áp vào form vẫn đối chiếu được với hội thoại đã sinh ra nó.
 *
 * Một lượt = một lần gọi `generate-draft`; phase này chưa có streaming và chưa có agent
 * nhiều bước — backend chưa đụng tới.
 */
export function LecterDrawer({
  open,
  slug,
  difficulty,
  onClose,
  onApply,
}: {
  open: boolean;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  onClose: () => void;
  onApply: (draft: LecterDraft) => void;
}) {
  const toast = useToast();
  // Đọc thẳng lúc khởi tạo state, không qua effect: `localStorage` không có ở lần render phía
  // server, mà khi đóng thì drawer không vẽ gì cả — hai phía cùng ra `null`, không lệch hydrate.
  const [sessions, setSessions] = useState<LecterSession[]>(() =>
    typeof window === "undefined" ? [] : readSessions(slug),
  );
  // `null` = chưa chọn gì, KHÔNG phải "hội thoại mới": mở lại thì tiếp tục hội thoại gần nhất,
  // còn bấm "Hội thoại mới" thì đặt hẳn một id mới chưa có trong kho nên danh sách tin nhắn rỗng.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [freshId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<LecterAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const currentId = activeId ?? sessions[0]?.id ?? freshId;
  const active = sessions.find((session) => session.id === currentId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  const persist = (next: LecterSession[]) => {
    setSessions(next);
    writeSessions(slug, next);
  };

  /** Ghi thêm tin nhắn vào hội thoại đang mở, tạo hội thoại mới nếu chưa có. */
  const append = (id: string, added: LecterMessage[]) => {
    setSessions((current) => {
      const base = current.some((session) => session.id === id)
        ? current
        : [{ ...newSession(), id }, ...current];
      const next = base
        .map((session) =>
          session.id === id
            ? {
                ...session,
                messages: [...session.messages, ...added],
                title: sessionTitle([...session.messages, ...added]),
                updatedAt: new Date().toISOString(),
              }
            : session,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      writeSessions(slug, next);
      return next;
    });
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || attachments.length === 0 || busy) return;
    const id = currentId;
    const sent = [...attachments];
    setActiveId(id);
    append(id, [
      { id: crypto.randomUUID(), role: "user", text: prompt, attachments: sent },
    ]);
    setInput("");
    setBusy(true);
    try {
      const generated = await api.workspaces.generateWorkspaceExerciseDraft(slug, {
        prompt,
        difficulty,
        documentIds: sent.map((item) => item.id),
      });
      append(id, [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Mình đã soạn một bản nháp từ ${generated.sourceDocuments.length} tài liệu đã duyệt.`,
          draft: generated,
        },
      ]);
    } catch (error) {
      const text = messageOf(error, "Lượt này hỏng. Thử lại giúp mình.");
      append(id, [{ id: crypto.randomUUID(), role: "assistant", text, failed: true }]);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    setActiveId(crypto.randomUUID());
    setInput("");
    setAttachments([]);
  };

  const remove = (id: string) => {
    persist(sessions.filter((session) => session.id !== id));
    if (id === currentId) startNew();
  };

  if (!open) return null;
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Lecter"
      /* Thanh công cụ bên dưới đã có tên, nút đóng và lịch sử: thêm header dựng sẵn nữa là hai
         hàng cùng nội dung, ăn mất chiều cao của khung chat. */
      showHeader={false}
      footer={
        <LecterComposer
          slug={slug}
          value={input}
          onChange={setInput}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          onSend={() => void send()}
          busy={busy}
        />
      }
    >
      <div className="flex min-h-full flex-col">
        <div className="sticky -top-4 z-20 -mx-4 -mt-4 mb-3 flex items-center justify-between gap-2 border-b border-border-soft bg-card px-4 py-2 sm:-mx-5 sm:px-5">
          <Button variant="ghost" size="sm" onClick={startNew}>
            <Plus aria-hidden="true" className="size-3.5" />
            Hội thoại mới
          </Button>
          <div className="flex items-center gap-1.5">
            <HistoryMenu
              sessions={sessions}
              activeId={currentId}
              onPick={(id) => {
                setActiveId(id);
                setInput("");
                setAttachments([]);
              }}
              onRemove={remove}
            />
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg hover:text-navy"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        {messages.length === 0 && !busy ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles aria-hidden="true" className="size-6" />
            </span>
            <p className="text-sm font-semibold text-navy">Bắt đầu từ tài liệu của nhóm</p>
            <p className="mt-2 max-w-sm text-xs leading-6 text-text-muted">
              Đính kèm tài liệu đã duyệt rồi mô tả bài tập bạn muốn: chủ đề, mức độ, dạng
              input/output. Lecter trả về đề bài và test case để bạn đưa vào form.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageRow key={message.id} message={message} onApply={onApply} />
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Lecter đang đọc tài liệu…
              </p>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
