"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronUp,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Minimize2,
  Pencil,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WorkspaceDetail, WorkspaceMessage, WorkspaceRole } from "../types";
import type { WorkspaceChatState } from "./use-workspace-chat";

export function WorkspaceChatTab({
  detail,
  chat,
}: {
  detail: WorkspaceDetail;
  chat: WorkspaceChatState;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef(0);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const list = listRef.current;
    if (!list || chat.loading || chat.messages.length === 0) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 180;
    if (nearBottom || previousHeight.current === 0) list.scrollTop = list.scrollHeight;
    previousHeight.current = list.scrollHeight;
  }, [chat.loading, chat.messages]);

  const loadOlder = async () => {
    const list = listRef.current;
    const oldHeight = list?.scrollHeight ?? 0;
    await chat.loadMore();
    requestAnimationFrame(() => {
      if (list) list.scrollTop += list.scrollHeight - oldHeight;
    });
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    if (await chat.send(content)) setDraft("");
  };

  return (
    <Card className="flex h-[calc(100dvh-12rem)] min-h-[40rem] w-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-navy">Chat nhóm</h2>
            <Badge tone="neutral">{detail.memberCount} thành viên</Badge>
          </div>
          <p className="mt-1 text-xs text-text-faint">
            Trao đổi bài tập, tài liệu và kế hoạch học tập trong Workspace.
          </p>
        </div>
        <ConnectionState connected={chat.connected} />
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto bg-surface-subtle px-3 py-4 sm:px-5 lg:px-6"
        aria-live="polite"
      >
        {chat.hasMore && (
          <div className="mb-4 flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadOlder()}
              disabled={chat.loadingMore}
            >
              {chat.loadingMore ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
              Tải tin nhắn cũ hơn
            </Button>
          </div>
        )}
        {chat.loading ? (
          <ChatLoading />
        ) : chat.messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          <div className="flex w-full flex-col gap-3">
            {chat.messages.map((message, index) => (
              <div key={message.id}>
                {showDay(chat.messages[index - 1], message) && (
                  <div className="my-4 flex items-center gap-3 text-2xs text-text-faint">
                    <span className="h-px flex-1 bg-border" />
                    {formatDay(message.createdAt)}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <MessageRow
                  message={message}
                  mine={message.senderId === chat.currentUserId}
                  canModerate={canModerate(detail.currentMembership.role)}
                  onUpdate={chat.update}
                  onRemove={chat.remove}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {chat.error && (
        <div className="border-t border-danger/20 bg-danger-tint px-4 py-2 text-xs text-danger">
          {chat.error}
        </div>
      )}
      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void submit()}
        sending={chat.sending}
        placeholder="Nhắn cho nhóm… Dùng ``` để chia sẻ code"
      />
    </Card>
  );
}

export function WorkspaceMiniChat({
  workspaceName,
  chat,
  onOpenFull,
}: {
  workspaceName: string;
  chat: WorkspaceChatState;
  onOpenFull: () => void;
}) {
  const [state, setState] = useState<"collapsed" | "open" | "closed">("collapsed");
  const [draft, setDraft] = useState("");
  const recent = useMemo(() => chat.messages.slice(-6), [chat.messages]);
  const setMiniVisible = chat.setMiniVisible;

  useEffect(() => {
    setMiniVisible(state === "open");
    return () => setMiniVisible(false);
  }, [setMiniVisible, state]);

  if (state === "closed") return null;
  if (state === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => setState("open")}
        className="fixed bottom-5 right-5 z-30 flex h-12 items-center gap-2 rounded-full border border-primary/40 bg-navy px-4 text-sm font-semibold text-on-ink shadow-lg transition-colors hover:bg-ink"
        aria-label="Mở chat nhóm"
      >
        <MessageCircle className="h-5 w-5 text-primary" />
        Chat nhóm
        {chat.unreadCount > 0 && (
          <span className="notification-badge flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-bold">
            {Math.min(chat.unreadCount, 99)}
          </span>
        )}
      </button>
    );
  }

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    if (await chat.send(content)) setDraft("");
  };

  return (
    <Card className="fixed bottom-5 right-5 z-30 flex h-[500px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-xl transition-[height,width,opacity] duration-300">
      <div className="flex items-center gap-2 border-b border-border bg-navy px-3 py-2.5 text-on-ink">
        <MessageCircle className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{workspaceName}</p>
          <p className="text-2xs text-on-ink/60">
            {chat.connected ? "Đang kết nối realtime" : "Đang kết nối lại"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenFull}
          className="rounded p-1 text-on-ink/70 hover:bg-on-ink/10 hover:text-on-ink"
          aria-label="Mở chat đầy đủ"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setState("collapsed")}
          className="rounded p-1 text-on-ink/70 hover:bg-on-ink/10 hover:text-on-ink"
          aria-label="Thu nhỏ chat"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setState("closed")}
          className="rounded p-1 text-on-ink/70 hover:bg-on-ink/10 hover:text-on-ink"
          aria-label="Đóng chat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-surface-subtle p-3">
        {chat.loading ? (
          <ChatLoading />
        ) : recent.length === 0 ? (
          <ChatEmpty compact />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((message) => (
              <div key={message.id} className="flex gap-2">
                <Avatar message={message} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-2xs font-semibold text-navy">
                      {message.sender.displayName}
                    </span>
                    <span className="text-2xs text-text-faint">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-text-muted">
                    {message.deletedAt ? "Tin nhắn đã bị xóa" : message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void submit()}
        sending={chat.sending}
        compact
        placeholder="Nhắn nhanh…"
      />
    </Card>
  );
}

function MessageRow({
  message,
  mine,
  canModerate: moderator,
  onUpdate,
  onRemove,
}: {
  message: WorkspaceMessage;
  mine: boolean;
  canModerate: boolean;
  onUpdate: (id: string, content: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const canDelete = !message.deletedAt && (mine || moderator);

  const save = async () => {
    if (await onUpdate(message.id, draft)) setEditing(false);
  };

  return (
    <div
      className={`group flex w-full items-start gap-2 sm:gap-3 ${mine ? "justify-end" : "justify-start"}`}
    >
      {!mine && <Avatar message={message} />}
      <div
        className={`flex min-w-0 max-w-[min(46rem,calc(100%-3rem))] flex-col ${mine ? "items-end" : "items-start"}`}
      >
        <div className={`mb-1 flex items-baseline gap-2 ${mine ? "justify-end" : ""}`}>
          <span className="text-xs font-semibold text-navy">{message.sender.displayName}</span>
          <span className="text-2xs text-text-faint">{formatTime(message.createdAt)}</span>
          {message.updatedAt !== message.createdAt && !message.deletedAt && (
            <span className="text-2xs text-text-faint">đã sửa</span>
          )}
        </div>
        <div
          className={`max-w-full rounded-xl border px-3 py-2 text-sm leading-relaxed ${
            mine
              ? "border-primary/30 bg-primary-tint text-navy"
              : "border-border bg-surface text-text-muted"
          }`}
        >
          {message.deletedAt ? (
            <span className="italic text-text-faint">Tin nhắn đã bị xóa</span>
          ) : editing ? (
            <div className="w-[min(520px,65vw)]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                maxLength={4000}
                className="w-full resize-y rounded-md border border-border bg-surface p-2 text-sm text-navy focus:border-primary"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Hủy</Button>
                <Button size="sm" onClick={() => void save()} disabled={!draft.trim()}>
                  <Check className="h-3.5 w-3.5" /> Lưu
                </Button>
              </div>
            </div>
          ) : (
            <RichMessage content={message.content ?? ""} />
          )}
        </div>
        {!editing && !message.deletedAt && (mine || canDelete) && (
          <div className={`mt-1 flex gap-1 ${mine ? "justify-end" : ""}`}>
            {mine && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-2xs text-text-faint hover:bg-surface hover:text-navy"
              >
                <Pencil className="h-3 w-3" /> Sửa
              </button>
            )}
            {canDelete &&
              (confirmingDelete ? (
                <span className="inline-flex items-center gap-1 text-2xs text-danger">
                  Xóa tin này?
                  <button type="button" className="font-semibold" onClick={() => void onRemove(message.id)}>Xóa</button>
                  <button type="button" onClick={() => setConfirmingDelete(false)}>Hủy</button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-2xs text-text-faint hover:bg-danger-tint hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" /> {mine ? "Xóa" : "Kiểm duyệt"}
                </button>
              ))}
          </div>
        )}
      </div>
      {mine && <Avatar message={message} />}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  placeholder,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending: boolean;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2 border-t border-border bg-surface ${compact ? "p-2.5" : "p-3 sm:p-4"}`}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        rows={compact ? 1 : 2}
        maxLength={4000}
        placeholder={placeholder}
        className="min-h-10 flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy placeholder:text-text-faint focus:border-primary"
      />
      <Button
        size={compact ? "sm" : "md"}
        onClick={onSubmit}
        disabled={sending || !value.trim()}
        aria-label="Gửi tin nhắn"
      >
        {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {!compact && "Gửi"}
      </Button>
    </div>
  );
}

function RichMessage({ content }: { content: string }) {
  const sections = content.split(/```/g);
  return (
    <div className="space-y-2 whitespace-pre-wrap break-words">
      {sections.map((section, index) =>
        index % 2 === 1 ? (
          <pre key={index} className="overflow-x-auto rounded-md bg-navy p-3 font-mono text-xs text-on-ink">
            <code>{section.replace(/^\w+\n/, "")}</code>
          </pre>
        ) : (
          <span key={index}>{linkify(section)}</span>
        ),
      )}
    </div>
  );
}

function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+|\/workspace\/[^\s]+)/g).map((part, index) =>
    /^(https?:\/\/|\/workspace\/)/.test(part) ? (
      <a
        key={index}
        href={part}
        target={part.startsWith("http") ? "_blank" : undefined}
        rel={part.startsWith("http") ? "noreferrer" : undefined}
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function Avatar({ message }: { message: WorkspaceMessage }) {
  return message.sender.avatarUrl ? (
    <img src={message.sender.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-2xs font-bold text-on-ink">
      {initials(message.sender.displayName)}
    </span>
  );
}

function ConnectionState({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-text-faint"}`}>
      {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {connected ? "Realtime" : "Đang kết nối lại"}
    </span>
  );
}

function ChatLoading() {
  return (
    <div className="flex h-full min-h-40 items-center justify-center gap-2 text-sm text-text-faint">
      <LoaderCircle className="h-4 w-4 animate-spin" /> Đang tải cuộc trò chuyện…
    </div>
  );
}

function ChatEmpty({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center text-text-faint ${compact ? "h-full" : "min-h-64"}`}>
      <MessageCircle className="mb-2 h-8 w-8 text-primary/60" />
      <p className="text-sm font-semibold text-navy">Bắt đầu cuộc trao đổi</p>
      <p className="mt-1 max-w-sm text-xs">Hỏi bài, chia sẻ tài liệu hoặc nhắc lịch học của nhóm.</p>
    </div>
  );
}

function canModerate(role: WorkspaceRole) {
  return role === "owner" || role === "deputy";
}

function showDay(previous: WorkspaceMessage | undefined, current: WorkspaceMessage) {
  return !previous || new Date(previous.createdAt).toDateString() !== new Date(current.createdAt).toDateString();
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
}
