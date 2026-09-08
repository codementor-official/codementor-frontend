"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronUp,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Link2,
  Paperclip,
  Minimize2,
  Pencil,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Modal } from "@codementor/ui";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WorkspaceDetail, WorkspaceMessage, WorkspaceRole } from "../types";
import type { WorkspaceChatState } from "./use-workspace-chat";
import { api } from "@/lib/api";

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
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resources, setResources] = useState<Array<{ url: string; title: string; kind: "file" | "link"; senderName: string; createdAt: string }>>([]);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

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

  const openResources = async () => {
    setResourcesOpen(true);
    setResourcesLoading(true);
    setResourcesError(null);
    try { setResources((await api.workspaces.messageResources(detail.slug)).items); }
    catch { setResourcesError("Không tải được tài nguyên đã chia sẻ."); }
    finally { setResourcesLoading(false); }
  };

  const attach = async (file: File) => {
    setAttaching(true);
    setAttachmentError(null);
    try {
      const signed = await api.workspaces.messageAttachmentUploadUrl(detail.slug, {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      if (file.size > signed.maxBytes) throw new Error("Tệp vượt quá dung lượng cho phép");
      const response = await fetch(signed.uploadUrl, { method: "PUT", headers: signed.headers, body: file });
      if (!response.ok) throw new Error("Không thể tải tệp lên storage");
      const marker = file.type.startsWith("image/") ? "🖼️" : "📎";
      if (!(await chat.send(`${marker} ${file.name}\n${signed.publicUrl}`))) throw new Error("Không thể gửi tin nhắn đính kèm");
      if (resourcesOpen) void openResources();
    } catch (cause) {
      setAttachmentError(cause instanceof Error ? cause.message : "Không thể gửi tài nguyên");
    } finally {
      setAttaching(false);
    }
  };

  return (
    <Card className="flex h-[calc(100dvh-10.5rem)] min-h-[34rem] max-h-[calc(100dvh-7rem)] w-full min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
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
        <div className="flex items-center gap-1"><button type="button" onClick={() => void openResources()} className="rounded-md border border-border p-2 text-text-muted hover:border-primary hover:text-primary" aria-label="Xem tài nguyên đã gửi" title="Tài nguyên đã gửi"><Paperclip className="h-4 w-4" /></button><ConnectionState connected={chat.connected} /></div>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-surface-subtle px-3 py-4 sm:px-5 lg:px-6"
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
        <div className="shrink-0 border-t border-danger/20 bg-danger-tint px-4 py-2 text-xs text-danger">
          {chat.error}
        </div>
      )}
      {attachmentError && <div role="alert" className="shrink-0 border-t border-danger/20 bg-danger-tint px-4 py-2 text-xs text-danger">{attachmentError}</div>}
      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void submit()}
        sending={chat.sending}
        placeholder="Nhắn cho nhóm… Dùng ``` để chia sẻ code"
        onAttach={(file) => void attach(file)}
        attaching={attaching}
      />
      <Modal open={resourcesOpen} onClose={() => setResourcesOpen(false)} title="Tài nguyên đã chia sẻ trong chat" width="lg">
        <p className="mb-4 text-xs text-text-muted">Tổng hợp file và liên kết từ tối đa 500 tin nhắn gần nhất của nhóm.</p>
        {resourcesLoading ? <p className="flex items-center gap-2 py-8 text-sm text-text-muted"><LoaderCircle className="h-4 w-4 animate-spin" /> Đang tổng hợp tài nguyên…</p> : resourcesError ? <p role="alert" className="text-sm text-danger">{resourcesError}</p> : resources.length === 0 ? <div className="py-10 text-center"><Paperclip className="mx-auto h-6 w-6 text-text-faint" /><p className="mt-2 text-sm font-semibold text-navy">Chưa có file hoặc liên kết</p><p className="mt-1 text-xs text-text-muted">Các URL được chia sẻ trong chat sẽ xuất hiện tại đây.</p></div> : <ul className="max-h-[60dvh] divide-y divide-border-soft overflow-y-auto">{resources.map((resource) => <li key={resource.url}><a href={resource.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 hover:text-primary"><span className="rounded-lg bg-bg p-2 text-primary">{resource.kind === "file" ? <Paperclip className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{resource.title}</span><span className="text-2xs text-text-muted">{resource.senderName} · {new Date(resource.createdAt).toLocaleString("vi-VN")}</span></span><ExternalLink className="h-4 w-4 text-text-faint" /></a></li>)}</ul>}
      </Modal>
    </Card>
  );
}

export function WorkspaceMiniChat({
  workspaceName,
  chat,
  onOpenFull,
  workspaces,
  selectedSlug,
  onSelectWorkspace,
  onClose,
}: {
  workspaceName: string;
  chat: WorkspaceChatState;
  onOpenFull: () => void;
  workspaces: Array<{ slug: string; name: string }>;
  selectedSlug: string;
  onSelectWorkspace: (slug: string) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<"collapsed" | "open">("collapsed");
  const [draft, setDraft] = useState("");
  const recent = useMemo(() => chat.messages.slice(-6), [chat.messages]);
  const setMiniVisible = chat.setMiniVisible;

  useEffect(() => {
    setMiniVisible(state === "open");
    return () => setMiniVisible(false);
  }, [setMiniVisible, state]);

  if (state === "collapsed") {
    return (
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-1.5">
        <button type="button" onClick={() => setState("open")} className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface shadow-lg transition-colors hover:border-primary" aria-label={`Mở chat nhóm ${workspaceName}`} title={`Chat · ${workspaceName}`}>
          <BrandLogo compact size="sm" />
          {chat.unreadCount > 0 && <span className="notification-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-bold">{Math.min(chat.unreadCount, 99)}</span>}
        </button>
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-text-faint shadow hover:border-danger/40 hover:text-danger" aria-label="Tắt chat nhóm thu nhỏ" title="Tắt chat nhóm thu nhỏ"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    if (await chat.send(content)) setDraft("");
  };

  return (
    <Card className="fixed bottom-5 right-5 z-30 flex h-[500px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden shadow-xl transition-[height,width,opacity] duration-300">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5 text-navy">
        <BrandLogo compact size="sm" />
        <div className="min-w-0 flex-1">
          <select value={selectedSlug} onChange={(event) => onSelectWorkspace(event.target.value)} aria-label="Chọn nhóm để trò chuyện" className="block w-full truncate border-0 bg-transparent p-0 text-xs font-bold text-navy">
            {workspaces.map((workspace) => <option key={workspace.slug} value={workspace.slug}>{workspace.name}</option>)}
          </select>
          <p className="text-2xs text-text-faint">
            {chat.connected ? "Sẵn sàng trò chuyện" : "Đang kết nối lại"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenFull}
          className="rounded p-1 text-text-muted hover:bg-bg hover:text-primary"
          aria-label="Mở chat đầy đủ"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setState("collapsed")}
          className="rounded p-1 text-text-muted hover:bg-bg hover:text-primary"
          aria-label="Thu nhỏ chat"
        >
          <Minimize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-text-muted hover:bg-danger-tint hover:text-danger"
          aria-label="Tắt chat nhóm thu nhỏ"
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
                    {message.deletedAt ? "Tin nhắn đã bị xóa" : messagePreview(message.content ?? "")}
                  </p>
                  {message.updatedAt !== message.createdAt && !message.deletedAt && <span className="text-2xs text-text-faint">Đã sửa</span>}
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
  const canEdit = mine && !message.deletedAt && !isAttachmentMessage(message.content ?? "");

  const save = async () => {
    if (await onUpdate(message.id, draft)) setEditing(false);
  };

  return (
    <div
      className={`group flex w-full items-start gap-2 sm:gap-3 ${mine ? "justify-end" : "justify-start"}`}
    >
      {!mine && <Avatar message={message} />}
      <div
        className={`flex min-w-0 max-w-[min(38rem,calc(100%-2.5rem))] flex-col ${mine ? "items-end" : "items-start"}`}
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
            {canEdit && (
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
  onAttach,
  attaching = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending: boolean;
  placeholder: string;
  compact?: boolean;
  onAttach?: (file: File) => void;
  attaching?: boolean;
}) {
  return (
    <div className={`${onAttach ? "grid grid-cols-[2.5rem_minmax(0,1fr)_auto]" : "flex"} relative z-10 min-w-0 shrink-0 items-end gap-2 border-t border-border bg-surface ${compact ? "p-2.5" : "px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"}`}>
      {onAttach && <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted hover:border-primary hover:text-primary" aria-label="Đính kèm file hoặc hình ảnh" title="Đính kèm file hoặc hình ảnh">{attaching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}<input type="file" className="sr-only" disabled={attaching || sending} accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAttach(file); event.target.value = ""; }} /></label>}
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
        className="min-h-10 min-w-0 w-full flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-navy placeholder:text-text-faint focus:border-primary"
      />
      <Button
        size={compact ? "sm" : "md"}
        className="shrink-0"
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
        {/https?:\/\/[^\s]+\.(png|jpe?g|gif|webp)(\?[^\s]*)?$/i.test(part) ? <img src={part} alt="Hình ảnh được chia sẻ trong chat" className="mt-2 block max-h-56 w-auto max-w-[min(100%,28rem)] rounded-lg border border-border object-contain" loading="lazy" /> : part}
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
    <span className={`inline-flex rounded-md p-2 ${connected ? "text-success" : "text-text-faint"}`} title={connected ? "Đã kết nối" : "Đang kết nối lại"}>
      {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span className="sr-only">{connected ? "Đã kết nối" : "Đang kết nối lại"}</span>
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

export function isAttachmentMessage(content: string) {
  return /^(?:🖼️|📎)\s+[^\r\n]+\r?\nhttps?:\/\/\S+$/u.test(content.trim());
}

function messagePreview(content: string) {
  if (isAttachmentMessage(content)) return content.split(/\r?\n/, 1)[0];
  return content;
}
