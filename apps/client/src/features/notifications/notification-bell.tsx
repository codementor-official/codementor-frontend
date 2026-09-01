"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/study-group/study-group-stats";
import type { AppNotification } from "@/types/notification";
import { useAuth } from "@/providers/auth-provider";
import { useNotifications } from "./use-notifications";

/** Quá số này thì con số không còn giúp gì, chỉ làm vỡ hình tròn của badge. */
const BADGE_CAP = 9;

export function NotificationBell() {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    freshIds,
    loadMore,
    markRead,
    markAllRead,
  } = useNotifications();

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

  // Chuông chỉ có nghĩa khi đã đăng nhập — thông báo là của một người cụ thể.
  if (status !== "authenticated") return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg hover:text-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
        onClick={() => setOpen((visible) => !visible)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notification-badge absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-2xs font-bold">
            {unreadCount > BADGE_CAP ? `${BADGE_CAP}+` : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          aria-label="Thông báo"
          className="animate-menu-in absolute top-full right-0 z-100 mt-2 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-md border border-border bg-surface shadow-dropdown"
          role="dialog"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border-soft px-4 py-2.5">
            <h2 className="text-sm font-semibold text-navy">Thông báo</h2>
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
              <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-text-muted">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Đang tải thông báo…
              </p>
            ) : error ? (
              <p className="px-4 py-10 text-center text-sm text-danger" role="alert">
                {error}
              </p>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-border" />
                <p className="mt-2 text-sm font-medium text-navy">Chưa có thông báo nào</p>
                <p className="mt-1 text-xs text-text-muted">
                  Khoá học, bài luyện tập và lộ trình mới sẽ xuất hiện ở đây.
                </p>
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
                className="w-full border-t border-border-soft px-4 py-2.5 text-xs font-semibold text-primary hover:bg-bg"
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
  /** Vừa tới qua socket — hook theo dõi, xem ghi chú ở `freshIds`. */
  isFresh: boolean;
  notification: AppNotification;
  onActivate: () => void;
  onMarkRead: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-navy">{notification.title}</p>
        {!notification.read && (
          <span
            aria-label="Chưa đọc"
            className="notification-badge mt-1.5 h-2 w-2 shrink-0 rounded-full"
          />
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{notification.message}</p>
      <p className="mt-1.5 text-2xs text-text-faint">{timeAgo(notification.createdAt)}</p>
    </>
  );

  return (
    <li
      className={`border-b border-border-soft last:border-b-0 ${isFresh ? "animate-notification-in" : ""}`}
    >
      {notification.actionUrl ? (
        // Điều hướng do `actionUrl` từ server quyết định — không có bảng ánh xạ
        // type → route nào ở frontend, nên thêm loại thông báo mới không phải sửa ở đây.
        <Link
          className="block px-4 py-3 transition-colors hover:bg-bg"
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
          className="block w-full px-4 py-3 text-left transition-colors hover:bg-bg"
          onClick={onMarkRead}
          type="button"
        >
          {body}
        </button>
      )}
    </li>
  );
}

/**
 * Dùng lại đúng cách diễn đạt đã có trong ứng dụng thay vì tự viết chuỗi "phút trước"
 * thứ hai — hai bản sẽ trôi khỏi nhau ngay lần đầu ai đó sửa chữ ở một nơi.
 */
function timeAgo(iso: string): string {
  return formatRelativeTime((Date.now() - new Date(iso).getTime()) / 60_000);
}
