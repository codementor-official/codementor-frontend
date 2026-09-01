"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";

/** Quá số này thì con số không còn giúp gì, chỉ làm vỡ hình tròn của badge. */
const BADGE_CAP = 9;
const PAGE_SIZE = 20;
/** Thông báo vừa tới qua socket còn được tô sáng trong bao lâu. */
const FRESH_MS = 10_000;

export interface UiNotification {
  id: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  createdAt: string;
  read: boolean;
}

/**
 * Cách ứng dụng này lấy thông báo về.
 *
 * Chuông ở cả ba ứng dụng đọc cùng một API nhưng đi qua ba đường khác nhau — client và
 * admin qua BFF, giảng viên gọi thẳng gateway với token giữ trong tab — nên phần "gọi
 * bằng cách nào" là thứ duy nhất mỗi bên tự khai. Nhồi ba nhánh `if (app === ...)` vào
 * đây thì component dùng chung lại phải biết nó đang chạy ở đâu.
 */
export interface NotificationSource {
  list: (params: { limit: number; before?: string }) => Promise<{
    items: UiNotification[];
    nextCursor: string | null;
  }>;
  unreadCount: () => Promise<number>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Vé bắt tay WebSocket, hoặc `null` khi phiên này không lấy được.
   *
   * Không có vé thì đơn giản là không có realtime: lịch sử vẫn hiện đủ và lần tải trang
   * sau vẫn đúng. Đó là lý do chuông không bao giờ báo lỗi vì chuyện này.
   */
  realtimeToken?: () => Promise<string | null>;
  /** Bỏ trống thì tắt hẳn realtime, chuông chỉ đọc lịch sử. */
  realtimeUrl?: string;
}

/** Tên sự kiện do realtime-service phát — xem `notification.gateway.ts`. */
const NOTIFICATION_EVENT = "notification:new";

interface SocketLike {
  on: (event: string, handler: (payload: unknown) => void) => void;
  disconnect: () => void;
}

/**
 * Lịch sử từ API + thông báo mới từ WebSocket, gộp thành một danh sách.
 *
 * MongoDB là nguồn sự thật, WebSocket chỉ là đường giao nhanh. Vì thế luồng luôn là:
 * đăng nhập → nạp lịch sử → rồi mới nối socket. Làm ngược lại thì một thông báo đến đúng
 * lúc đang nạp sẽ bị danh sách vừa nạp xong ghi đè mất.
 */
export function useNotifications(source: NotificationSource, enabled: boolean) {
  const [items, setItems] = useState<UiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());

  /**
   * Bản sao đồng bộ của `items`.
   *
   * `markRead` chạy từ một trình xử lý sự kiện và phải biết NGAY thông báo đó đã đọc hay
   * chưa. Đọc `items` từ closure sẽ lấy giá trị của lần render cũ, còn đọc bên trong
   * updater của `setItems` thì kết quả tới quá muộn — đó chính là con bug "bấm vào thông
   * báo rồi F5 lại thấy chưa đọc".
   */
  const itemsRef = useRef<UiNotification[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const freshTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const timer of freshTimers.current) clearTimeout(timer);
    },
    [],
  );

  // `source` được dựng lại ở mỗi lần render của bên gọi. Giữ trong ref để hai effect dưới
  // đây không phải phụ thuộc vào nó — nếu không, socket sẽ nối lại mỗi lần cha render.
  const sourceRef = useRef(source);
  useEffect(() => {
    sourceRef.current = source;
  });

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [page, unread] = await Promise.all([
          sourceRef.current.list({ limit: PAGE_SIZE }),
          sourceRef.current.unreadCount(),
        ]);
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setUnreadCount(unread);
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
  }, [enabled]);

  // Socket sống suốt phiên, còn lịch sử chỉ nạp một lần — gộp hai effect thì mỗi lần nạp
  // lại sẽ dựng lại cả kết nối.
  useEffect(() => {
    const { realtimeToken, realtimeUrl } = sourceRef.current;
    if (!enabled || !realtimeToken || !realtimeUrl) return;

    let disposed = false;
    let socket: SocketLike | null = null;

    void (async () => {
      const token = await realtimeToken();
      if (!token || disposed) return;

      // Nạp động: chuông là thứ duy nhất trong bộ giao diện cần socket.io, và bắt mọi
      // trang của cả ba ứng dụng tải nó trong bundle đầu tiên là trả giá cho một tính
      // năng chỉ chạy sau khi đã đăng nhập.
      const { io } = await import("socket.io-client");
      if (disposed) return;

      const connection = io(`${realtimeUrl}/realtime`, {
        // Token đi trong `auth`, KHÔNG phải query string: query string bị ghi vào access
        // log của mọi proxy trên đường đi.
        auth: { token },
        transports: ["websocket"],
        reconnectionDelayMax: 10_000,
      });
      socket = connection as unknown as SocketLike;

      socket.on(NOTIFICATION_EVENT, (payload) => {
        const incoming = payload as {
          notificationId: string;
          title: string;
          message: string;
          actionLabel: string | null;
          actionUrl: string | null;
          createdAt: string;
        };
        const notification: UiNotification = {
          id: incoming.notificationId,
          title: incoming.title,
          message: incoming.message,
          actionLabel: incoming.actionLabel,
          actionUrl: incoming.actionUrl,
          createdAt: incoming.createdAt,
          read: false,
        };

        setItems((current) =>
          // Cùng một thông báo có thể tới hai lần khi socket nối lại giữa chừng.
          current.some((item) => item.id === notification.id)
            ? current
            : [notification, ...current],
        );
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
    };
  }, [enabled]);

  const loadMore = useCallback(async () => {
    if (cursor === null) return;
    try {
      const page = await sourceRef.current.list({ limit: PAGE_SIZE, before: cursor });
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải thêm được");
    }
  }, [cursor]);

  const markRead = useCallback(async (id: string) => {
    const target = itemsRef.current.find((item) => item.id === id);
    if (!target || target.read) return;

    // Đổi giao diện trước rồi mới gọi API: chờ mạng xong mới đổi màu thì thấy giật.
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount((count) => Math.max(count - 1, 0));
    try {
      await sourceRef.current.markRead(id);
    } catch {
      // Lần tải sau lấy lại trạng thái đúng từ server; không quấy người dùng vì việc này.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
    setUnreadCount(0);
    try {
      await sourceRef.current.markAllRead();
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

/**
 * Chuông thông báo dùng chung cho cả ba ứng dụng.
 *
 * Điều hướng do `actionUrl` từ server quyết định — không có bảng ánh xạ loại → route nào
 * ở frontend, nên thêm một loại thông báo mới không phải sửa file này.
 */
export function NotificationBell({
  source,
  enabled,
  emptyHint = "Thông báo mới sẽ xuất hiện ở đây.",
}: {
  source: NotificationSource;
  /** Chuông chỉ có nghĩa khi đã đăng nhập — thông báo là của một người cụ thể. */
  enabled: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, loading, error, hasMore, freshIds, loadMore, markRead, markAllRead } =
    useNotifications(source, enabled);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((visible) => !visible)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-4" />
        {unreadCount > 0 && (
          <span className="notification-badge absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-2xs font-bold">
            {unreadCount > BADGE_CAP ? `${BADGE_CAP}+` : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          aria-label="Thông báo"
          className="absolute top-full right-0 z-50 mt-2 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-card shadow-lg"
          role="dialog"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Thông báo</h2>
            {unreadCount > 0 && (
              <button
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => void markAllRead()}
                type="button"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Đang tải thông báo…
              </p>
            ) : error ? (
              <p className="px-4 py-10 text-center text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell aria-hidden="true" className="mx-auto size-8 text-border" />
                <p className="mt-2 text-sm font-medium">Chưa có thông báo nào</p>
                <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
              </div>
            ) : (
              <ul>
                {items.map((notification) => (
                  <NotificationRow
                    isFresh={freshIds.has(notification.id)}
                    key={notification.id}
                    notification={notification}
                    onActivate={() => {
                      void markRead(notification.id);
                      setOpen(false);
                    }}
                    onMarkRead={() => void markRead(notification.id)}
                  />
                ))}
              </ul>
            )}

            {hasMore && !loading && (
              <button
                className="w-full border-t border-border px-4 py-2.5 text-xs font-semibold text-primary hover:bg-muted"
                onClick={() => void loadMore()}
                type="button"
              >
                Xem thêm
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  isFresh,
  notification,
  onActivate,
  onMarkRead,
}: {
  isFresh: boolean;
  notification: UiNotification;
  onActivate: () => void;
  onMarkRead: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold">{notification.title}</p>
        {!notification.read && (
          <span aria-label="Chưa đọc" className="notification-badge mt-1.5 size-2 shrink-0 rounded-full" />
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p>
      <p className="mt-1.5 text-2xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
    </>
  );

  return (
    <li className={`border-b border-border last:border-b-0 ${isFresh ? "bg-primary/5" : ""}`}>
      {notification.actionUrl ? (
        <Link
          className="block px-4 py-3 transition-colors hover:bg-muted"
          href={notification.actionUrl}
          onClick={onActivate}
        >
          {body}
          {notification.actionLabel && (
            <span className="mt-2 inline-block text-xs font-semibold text-primary">
              {notification.actionLabel} →
            </span>
          )}
        </Link>
      ) : (
        // Thông báo không có nơi để tới (bảo trì hệ thống): bấm vào chỉ để đánh dấu đã đọc.
        <button
          className="block w-full px-4 py-3 text-left transition-colors hover:bg-muted"
          onClick={onMarkRead}
          type="button"
        >
          {body}
        </button>
      )}
    </li>
  );
}

function timeAgo(iso: string): string {
  const minutes = Math.max((Date.now() - new Date(iso).getTime()) / 60_000, 0);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${Math.floor(minutes)} phút trước`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} giờ trước`;
  return `${Math.floor(minutes / (60 * 24))} ngày trước`;
}
