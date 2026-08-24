"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { realtimeUrl } from "@/lib/env";
import { useAuth } from "@/providers/auth-provider";
import type { WorkspaceMessage } from "../types";

const PAGE_SIZE = 30;

interface RealtimeAck<T> {
  ok: boolean;
  error?: string;
  message?: T;
}

export interface WorkspaceChatState {
  messages: WorkspaceMessage[];
  loading: boolean;
  loadingMore: boolean;
  sending: boolean;
  connected: boolean;
  error: string | null;
  unreadCount: number;
  hasMore: boolean;
  currentUserId: string | null;
  send: (content: string) => Promise<boolean>;
  update: (messageId: string, content: string) => Promise<boolean>;
  remove: (messageId: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  markRead: () => Promise<void>;
  setMiniVisible: (visible: boolean) => void;
}

export function useWorkspaceChat(
  slug: string,
  enabled: boolean,
  fullChatVisible: boolean,
): WorkspaceChatState {
  const { status, user, realtimeToken } = useAuth();
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const fullVisibleRef = useRef(fullChatVisible);
  const miniVisibleRef = useRef(false);

  useEffect(() => {
    fullVisibleRef.current = fullChatVisible;
  }, [fullChatVisible]);

  const markRead = useCallback(async () => {
    if (!enabled || status !== "authenticated") return;
    setUnreadCount(0);
    try {
      await api.workspaces.markMessagesRead(slug);
      socketRef.current?.emit("message:read", { slug });
      window.dispatchEvent(
        new CustomEvent("workspace-unread-changed", { detail: { slug } }),
      );
    } catch {
      // Unread state is recovered from the API the next time the Workspace opens.
    }
  }, [enabled, slug, status]);

  useEffect(() => {
    if (!fullChatVisible) return;
    const timer = window.setTimeout(() => void markRead(), 0);
    return () => window.clearTimeout(timer);
  }, [fullChatVisible, markRead]);

  useEffect(() => {
    if (!enabled || status !== "authenticated") {
      const timer = window.setTimeout(() => {
        setMessages([]);
        setCursor(null);
        setUnreadCount(0);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([
      api.workspaces.messages(slug, { limit: PAGE_SIZE }),
      api.workspaces.unreadMessages(slug),
    ])
      .then(([page, unread]) => {
        if (cancelled) return;
        setMessages((current) =>
          mergeMessages([...page.items].reverse(), current),
        );
        setCursor(page.nextCursor);
        setUnreadCount(unread.count);
      })
      .catch((cause) => {
        if (!cancelled)
          setError(messageOf(cause, "Không tải được lịch sử chat."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, slug, status]);

  useEffect(() => {
    if (!enabled || status !== "authenticated") return;
    let disposed = false;
    let socket: Socket | null = null;

    void (async () => {
      const token = await realtimeToken();
      if (!token || disposed) return;
      socket = io(`${realtimeUrl}/realtime`, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelayMax: 10_000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        setError(null);
        socket?.emit("workspace:join", { slug }, (ack: RealtimeAck<never>) => {
          if (!ack?.ok)
            setError(ack?.error || "Không thể tham gia phòng chat.");
          else setError(null);
        });
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", (cause) => setError(cause.message));
      socket.on("auth:error", () => {
        setConnected(false);
        setError("Phiên realtime đã hết hạn. Đang kết nối lại…");
        void realtimeToken().then((freshToken) => {
          if (!freshToken || disposed || !socket) return;
          socket.auth = { token: freshToken };
          socket.connect();
        });
      });

      const applyIncoming = (payload: {
        slug: string;
        message: WorkspaceMessage;
      }) => {
        if (payload.slug !== slug) return;
        setMessages((current) => mergeMessages(current, [payload.message]));
        if (
          payload.message.senderId !== user?.id &&
          !fullVisibleRef.current &&
          !miniVisibleRef.current
        ) {
          setUnreadCount((count) => count + 1);
          window.dispatchEvent(
            new CustomEvent("workspace-unread-changed", { detail: { slug } }),
          );
        } else if (payload.message.senderId !== user?.id) {
          void markRead();
        }
      };
      const applyChange = (payload: {
        slug: string;
        message: WorkspaceMessage;
      }) => {
        if (payload.slug !== slug) return;
        setMessages((current) => mergeMessages(current, [payload.message]));
      };
      socket.on("message:new", applyIncoming);
      socket.on("message:update", applyChange);
      socket.on("message:delete", applyChange);
    })();

    return () => {
      disposed = true;
      socket?.emit("workspace:leave", { slug });
      socket?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, markRead, realtimeToken, slug, status, user?.id]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.workspaces.messages(slug, {
        before: cursor,
        limit: PAGE_SIZE,
      });
      setMessages((current) =>
        mergeMessages([...page.items].reverse(), current),
      );
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(messageOf(cause, "Không tải thêm được lịch sử chat."));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, slug]);

  const runMessageAction = useCallback(
    async (
      event: "message:send" | "message:update" | "message:delete",
      payload: Record<string, string>,
      fallback: () => Promise<WorkspaceMessage>,
    ) => {
      setSending(true);
      setError(null);
      try {
        const socket = socketRef.current;
        let message: WorkspaceMessage;
        if (socket?.connected) {
          let ack = (await socket.timeout(8_000).emitWithAck(event, {
            slug,
            ...payload,
          })) as RealtimeAck<WorkspaceMessage>;
          if (!ack.ok && /unauthorized|phiên/i.test(ack.error ?? "")) {
            const freshToken = await realtimeToken();
            if (freshToken) {
              socket.auth = { token: freshToken };
              socket.disconnect().connect();
              await new Promise<void>((resolve, reject) => {
                const timer = window.setTimeout(
                  () => reject(new Error("Kết nối lại quá thời gian")),
                  8_000,
                );
                socket.once("connect", () => {
                  window.clearTimeout(timer);
                  resolve();
                });
                socket.once("connect_error", (cause) => {
                  window.clearTimeout(timer);
                  reject(cause);
                });
              });
              const join = (await socket
                .timeout(8_000)
                .emitWithAck("workspace:join", {
                  slug,
                })) as RealtimeAck<never>;
              if (!join.ok)
                throw new Error(
                  join.error || "Không thể kết nối lại phòng chat",
                );
              ack = (await socket.timeout(8_000).emitWithAck(event, {
                slug,
                ...payload,
              })) as RealtimeAck<WorkspaceMessage>;
            }
          }
          if (!ack.ok || !ack.message)
            throw new Error(ack.error || "Realtime không phản hồi");
          message = ack.message;
        } else {
          message = await fallback();
        }
        setMessages((current) => mergeMessages(current, [message]));
        return true;
      } catch (cause) {
        setError(messageOf(cause, "Không thể gửi thay đổi chat."));
        return false;
      } finally {
        setSending(false);
      }
    },
    [realtimeToken, slug],
  );

  const send = useCallback(
    (content: string) =>
      runMessageAction("message:send", { content }, () =>
        api.workspaces.createMessage(slug, content),
      ),
    [runMessageAction, slug],
  );
  const update = useCallback(
    (messageId: string, content: string) =>
      runMessageAction("message:update", { messageId, content }, () =>
        api.workspaces.updateMessage(slug, messageId, content),
      ),
    [runMessageAction, slug],
  );
  const remove = useCallback(
    (messageId: string) =>
      runMessageAction("message:delete", { messageId }, () =>
        api.workspaces.deleteMessage(slug, messageId),
      ),
    [runMessageAction, slug],
  );
  const setMiniVisible = useCallback(
    (visible: boolean) => {
      miniVisibleRef.current = visible;
      if (visible) void markRead();
    },
    [markRead],
  );

  return {
    messages,
    loading,
    loadingMore,
    sending,
    connected,
    error,
    unreadCount,
    hasMore: cursor !== null,
    currentUserId: user?.id ?? null,
    send,
    update,
    remove,
    loadMore,
    markRead,
    setMiniVisible,
  };
}

function mergeMessages(...groups: WorkspaceMessage[][]) {
  const byId = new Map<string, WorkspaceMessage>();
  groups.flat().forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime() || left.id.localeCompare(right.id),
  );
}

function messageOf(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
