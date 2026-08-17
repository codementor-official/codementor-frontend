"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { realtimeUrl } from "@/lib/env";
import type { AppNotification } from "@/types/notification";
import { useAuth } from "@/providers/auth-provider";

const PAGE_SIZE = 20;

/** Tên sự kiện do realtime-service phát. Đổi ở đây thì phải đổi cả `notification.gateway.ts`. */
const NOTIFICATION_EVENT = "notification:new";

/** Thông báo vừa tới qua socket còn được tô sáng trong bao lâu. */
const FRESH_MS = 10_000;

export interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  /**
   * Id của những mục vừa tới realtime, để component tô hiệu ứng.
   *
   * Ở đây chứ không phải so `createdAt` với `Date.now()` lúc render: `Date.now()` là hàm
   * không thuần, hai lần render liền nhau cho hai kết quả khác nhau và React không đảm
   * bảo được gì về giao diện. Danh sách này chỉ đổi khi có thông báo mới thật.
   */
  freshIds: ReadonlySet<string>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Lịch sử từ API + thông báo mới từ WebSocket, gộp thành một danh sách.
 *
 * MongoDB là nguồn sự thật, WebSocket chỉ là đường giao nhanh. Vì thế luồng luôn là:
 * đăng nhập → nạp lịch sử → rồi mới nối socket. Làm ngược lại thì một thông báo đến
 * đúng lúc đang nạp sẽ bị danh sách vừa nạp xong ghi đè mất.
 */
export function useNotifications(): NotificationState {
  const { status, realtimeToken } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const socketRef = useRef<Socket | null>(null);
  // Hẹn giờ gỡ hiệu ứng; dọn khi unmount để không setState trên component đã biến mất.
  const freshTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      for (const timer of freshTimers.current) clearTimeout(timer);
    },
    [],
  );

  // Nạp lịch sử khi đã đăng nhập.
  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setUnreadCount(0);
      setLoading(status === "loading");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [page, unread] = await Promise.all([
          api.notifications.list({ limit: PAGE_SIZE }),
          api.notifications.unreadCount(),
        ]);
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setUnreadCount(unread.count);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Không tải được thông báo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // Kết nối realtime. Tách khỏi effect nạp lịch sử: socket sống suốt phiên, còn lịch sử
  // chỉ nạp một lần — gộp chung thì mỗi lần nạp lại sẽ dựng lại cả kết nối.
  useEffect(() => {
    if (status !== "authenticated") return;

    let disposed = false;
    let socket: Socket | null = null;

    void (async () => {
      const token = await realtimeToken();
      // Không có token thì đơn giản là không có realtime. Lịch sử vẫn hiển thị bình
      // thường, và lần tải trang sau sẽ thấy đủ — không có gì bị mất.
      if (!token || disposed) return;

      socket = io(`${realtimeUrl}/realtime`, {
        // Token đi trong `auth`, không phải query string: query string bị ghi vào access
        // log của mọi proxy trên đường đi.
        auth: { token },
        transports: ["websocket"],
        reconnectionDelayMax: 10_000,
      });
      socketRef.current = socket;

      socket.on(NOTIFICATION_EVENT, (incoming: Omit<AppNotification, "read" | "id"> & { notificationId: string }) => {
        const notification: AppNotification = {
          id: incoming.notificationId,
          type: incoming.type,
          title: incoming.title,
          message: incoming.message,
          referenceType: incoming.referenceType,
          referenceId: incoming.referenceId,
          actionLabel: incoming.actionLabel,
          actionUrl: incoming.actionUrl,
          metadata: {},
          createdAt: incoming.createdAt,
          read: false,
        };

        setItems((current) => {
          // Cùng một thông báo có thể tới hai lần khi socket nối lại giữa chừng.
          if (current.some((item) => item.id === notification.id)) return current;
          return [notification, ...current];
        });
        setUnreadCount((count) => count + 1);

        setFreshIds((current) => new Set(current).add(notification.id));
        freshTimers.current.push(
          setTimeout(() => {
            setFreshIds((current) => {
              const next = new Set(current);
              next.delete(notification.id);
              return next;
            });
          }, FRESH_MS),
        );
      });
    })();

    return () => {
      disposed = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [status, realtimeToken]);

  const loadMore = useCallback(async () => {
    if (cursor === null) return;
    try {
      const page = await api.notifications.list({ limit: PAGE_SIZE, before: cursor });
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải thêm được");
    }
  }, [cursor]);

  const markRead = useCallback(async (id: string) => {
    // Đổi giao diện trước rồi mới gọi API: đánh dấu đã đọc là thao tác không thể hỏng
    // theo cách người dùng cần biết, còn chờ mạng xong mới đổi màu thì thấy giật.
    let changed = false;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id || item.read) return item;
        changed = true;
        return { ...item, read: true };
      }),
    );
    if (!changed) return;
    setUnreadCount((count) => Math.max(count - 1, 0));

    try {
      await api.notifications.markRead(id);
    } catch {
      // Lần tải sau sẽ lấy lại trạng thái đúng từ server; không quấy người dùng vì việc này.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead();
    } catch {
      /* như trên */
    }
  }, []);

  return {
    items,
    unreadCount,
    loading,
    error,
    hasMore: cursor !== null,
    freshIds,
    loadMore,
    markRead,
    markAllRead,
  };
}
