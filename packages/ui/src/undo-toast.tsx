"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Undo2 } from "lucide-react";

/** Đủ lâu để đọc xong dòng thông báo và bấm hoàn tác, không lâu tới mức người dùng quên mất nó còn ở đó. */
const DEFAULT_DURATION_MS = 6000;

interface PendingDelete {
  id: string;
  message: string;
  expiresAt: number;
  commit: () => void | Promise<unknown>;
  onCommit?: () => void;
  onError?: (error: unknown) => void;
}

interface UndoToastState {
  /** `id` nào đang trong thời gian chờ — trang danh sách lọc theo tập này để ẩn dòng ngay. */
  pendingIds: ReadonlySet<string>;
  /**
   * Xoá trễ: dòng biến mất khỏi màn NGAY, nhưng lệnh xoá thật chỉ chạy sau một khoảng chờ.
   * Bấm "Hoàn tác" trong lúc đó thì `commit` không bao giờ chạy — khác hẳn xác nhận trước
   * khi xoá, đây là cơ hội đổi ý SAU khi đã xác nhận.
   */
  scheduleDelete: (input: {
    id: string;
    message: string;
    commit: () => void | Promise<unknown>;
    /** Chạy SAU KHI `commit` xong — trang gọi `load()` ở đây để bảng không hiện lại dòng cũ. */
    onCommit?: () => void;
    /** Chạy khi `commit` thất bại — trang hiện toast lỗi ở đây. */
    onError?: (error: unknown) => void;
  }) => void;
}

const UndoToastContext = createContext<UndoToastState | null>(null);

/**
 * Đặt Ở GỐC layout của ứng dụng, không phải trong từng trang: một lượt xoá bấm từ màn
 * danh sách rồi điều hướng đi ngay (trường hợp Studio) vẫn phải giữ được hộp "Hoàn tác"
 * qua cú chuyển trang — component sống trong chính trang đó sẽ biến mất cùng nó.
 */
export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDelete[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
    };
  }, []);

  const scheduleDelete = useCallback<UndoToastState["scheduleDelete"]>(({ id, message, commit, onCommit, onError }) => {
    const expiresAt = Date.now() + DEFAULT_DURATION_MS;
    setPending((current) => [...current.filter((item) => item.id !== id), { id, message, expiresAt, commit, onCommit, onError }]);

    const timer = setTimeout(async () => {
      timers.current.delete(id);
      setPending((current) => current.filter((item) => item.id !== id));
      try {
        await commit();
      } catch (error) {
        onError?.(error);
      } finally {
        onCommit?.();
      }
    }, DEFAULT_DURATION_MS);
    // Gọi lại cùng id (vd. xoá rồi xoá tiếp một dòng khác trùng id do render lại) thì huỷ
    // hẹn giờ cũ trước — nếu không, bản ghi có thể bị xoá hai lần.
    const previous = timers.current.get(id);
    if (previous) clearTimeout(previous);
    timers.current.set(id, timer);
  }, []);

  const undo = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setPending((current) => current.filter((item) => item.id !== id));
  }, []);

  const pendingIds = useMemo(() => new Set(pending.map((item) => item.id)), [pending]);
  const value = useMemo<UndoToastState>(() => ({ pendingIds, scheduleDelete }), [pendingIds, scheduleDelete]);

  return (
    <UndoToastContext.Provider value={value}>
      {children}
      {pending.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4">
          {/* Một khối keyframes cho cả chồng toast, không phải một bản mỗi dòng — số
            * lượng thẻ style bằng số lượng bản ghi vừa xoá cùng lúc là lãng phí vô ích. */}
          <style>{"@keyframes cm-undo-shrink { from { width: 100%; } to { width: 0%; } }"}</style>
          {pending.map((item) => (
            <UndoToastRow item={item} key={item.id} onUndo={() => undo(item.id)} />
          ))}
        </div>
      )}
    </UndoToastContext.Provider>
  );
}

function UndoToastRow({ item, onUndo }: { item: PendingDelete; onUndo: () => void }) {
  // Đo lại tỉ lệ thời gian còn lại thay vì đặt cứng animation 6000ms — nếu sau này
  // `DEFAULT_DURATION_MS` đổi, thanh đếm ngược ở đây không được phép trôi khỏi bộ hẹn giờ
  // thật đang chạy trong provider. Đọc đồng hồ MỘT lần trong initializer của state, không
  // phải giữa thân render: `Date.now()` lúc render là hàm không thuần.
  const [remainingMs] = useState(() => Math.max(item.expiresAt - Date.now(), 0));

  return (
    <div
      className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-lg border border-border bg-foreground px-4 py-3 text-background shadow-lg"
      role="status"
    >
      <span className="min-w-0 flex-1 truncate text-sm">{item.message}</span>
      <button
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-background/10 px-2.5 py-1.5 text-sm font-semibold hover:bg-background/20"
        onClick={onUndo}
        type="button"
      >
        <Undo2 aria-hidden="true" className="size-3.5" />
        Hoàn tác
      </button>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-background/20">
        <div
          className="h-full bg-background/60"
          style={{ animation: `cm-undo-shrink ${remainingMs}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

/**
 * `null` khi dùng ngoài `UndoToastProvider` — trả về hành vi "xoá ngay, không hoãn" thay
 * vì ném lỗi, để một trang lỡ chưa được bọc provider vẫn xoá được, chỉ là không có hoàn tác.
 */
export function useUndoableDelete(): UndoToastState {
  return (
    useContext(UndoToastContext) ?? {
      pendingIds: new Set(),
      scheduleDelete: ({ commit }) => void commit(),
    }
  );
}
