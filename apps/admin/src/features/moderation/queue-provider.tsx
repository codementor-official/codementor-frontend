"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAdminApi } from "@/features/auth/admin-api";
import { moderationApi } from "@/lib/api";
import { CONTENT_KINDS, KINDS, type ContentKind, type QueueItem } from "./types";

interface QueueState {
  /** Số mục ĐANG CHỜ theo loại, để vẽ số trên tab và trên thanh bên. */
  pendingByKind: Record<ContentKind, number>;
  pendingTotal: number;
  loading: boolean;
  /** Tên những hàng chờ không đọc được, nếu có. */
  failed: string[];
  refreshPending: () => Promise<void>;
}

const QueueContext = createContext<QueueState | null>(null);

/**
 * Con số "còn bao nhiêu việc chờ tôi" — dùng ở thanh bên và ở tab của màn kiểm duyệt.
 *
 * CHỈ đếm `pending_review`, và đó là toàn bộ lý do provider này tồn tại ở gốc ứng dụng.
 * Danh sách hiển thị của màn kiểm duyệt KHÔNG lấy từ đây: màn đó đọc theo khay đang chọn
 * (Đang chờ / Đã duyệt / Đã từ chối) và tự giữ dữ liệu của mình. Nhét cả ba khay vào đây
 * sẽ khiến con số đỏ trên thanh bên đổi theo tab người dùng đang mở — nó phải luôn là
 * "còn bao nhiêu việc chờ", không phải "đang xem bao nhiêu dòng".
 */
export function ModerationQueueProvider({ children }: { children: ReactNode }) {
  const request = useAdminApi();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Bốn hàng chờ, bốn service, gộp ở đây.
   *
   * Không có endpoint gộp ở backend: một endpoint như thế buộc một service đọc bảng của
   * service khác. `allSettled` chứ không `all` — một service chết thì ba hàng chờ còn lại
   * vẫn phải xem được, và tên hàng chờ hỏng phải hiện ra chứ không lặng lẽ thành "trống".
   */
  const refreshPending = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      CONTENT_KINDS.map((kind) => moderationApi.queue(request, kind)),
    );

    const collected: QueueItem[] = [];
    const broken: string[] = [];
    results.forEach((result, index) => {
      const kind = CONTENT_KINDS[index];
      if (result.status === "fulfilled") {
        collected.push(...result.value.items.map((item) => ({ ...item, kind })));
      } else {
        broken.push(KINDS[kind].label);
      }
    });

    setItems(collected);
    setFailed(broken);
    setLoading(false);
  }, [request]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const value = useMemo<QueueState>(() => {
    const pendingByKind = Object.fromEntries(
      CONTENT_KINDS.map((kind) => [kind, items.filter((item) => item.kind === kind).length]),
    ) as Record<ContentKind, number>;

    return { pendingByKind, pendingTotal: items.length, loading, failed, refreshPending };
  }, [items, loading, failed, refreshPending]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

/**
 * `null` khi dùng ngoài provider. Trả về trạng thái rỗng thay vì ném lỗi: thanh bên cũng
 * render ở màn đăng nhập, nơi chưa có phiên nào để đọc hàng chờ.
 */
export function useModerationQueue(): QueueState {
  return (
    useContext(QueueContext) ?? {
      pendingByKind: { articles: 0, courses: 0, roadmaps: 0, exercises: 0 },
      pendingTotal: 0,
      loading: false,
      failed: [],
      refreshPending: async () => {},
    }
  );
}
