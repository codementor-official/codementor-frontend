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
  items: QueueItem[];
  /** Số mục đang chờ theo loại, để vẽ số trên tab. */
  countByKind: Record<ContentKind, number>;
  total: number;
  loading: boolean;
  /** Tên những hàng chờ không đọc được, nếu có. */
  failed: string[];
  refresh: () => Promise<void>;
}

const QueueContext = createContext<QueueState | null>(null);

/**
 * Một lần đọc hàng chờ, hai nơi dùng: con số đỏ trên thanh bên và chính màn kiểm duyệt.
 *
 * Để mỗi bên tự gọi API thì con số trên thanh bên sẽ đứng yên sau khi duyệt xong một mục
 * — người dùng vừa xử lý xong vẫn thấy "còn 5 việc", và cách duy nhất để nó đúng là F5.
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
  const refresh = useCallback(async () => {
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

    // Cũ trước: hàng chờ là hàng chờ, ai gửi sớm được xem trước.
    collected.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    setItems(collected);
    setFailed(broken);
    setLoading(false);
  }, [request]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<QueueState>(() => {
    const countByKind = Object.fromEntries(
      CONTENT_KINDS.map((kind) => [kind, items.filter((item) => item.kind === kind).length]),
    ) as Record<ContentKind, number>;

    return { items, countByKind, total: items.length, loading, failed, refresh };
  }, [items, loading, failed, refresh]);

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

/**
 * `null` khi dùng ngoài provider. Trả về trạng thái rỗng thay vì ném lỗi: thanh bên cũng
 * render ở màn đăng nhập, nơi chưa có phiên nào để đọc hàng chờ.
 */
export function useModerationQueue(): QueueState {
  return (
    useContext(QueueContext) ?? {
      items: [],
      countByKind: { articles: 0, courses: 0, roadmaps: 0, exercises: 0 },
      total: 0,
      loading: false,
      failed: [],
      refresh: async () => {},
    }
  );
}
