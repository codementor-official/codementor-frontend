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
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

/** Đủ để đọc một câu, đủ ngắn để không che nội dung. Lỗi ở lâu hơn vì nó cần đọc kỹ. */
const LIFETIME: Record<ToastTone, number> = { success: 3200, info: 4000, error: 6000 };

const TONES: Record<ToastTone, { className: string; icon: typeof Info }> = {
  success: { className: "border-success/40 bg-success/10 text-success", icon: CheckCircle2 },
  error: { className: "border-destructive/40 bg-destructive/10 text-destructive", icon: TriangleAlert },
  info: { className: "border-border bg-card text-foreground", icon: Info },
};

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Kết quả của một thao tác, hiện rồi tự mất.
 *
 * Trước đây mỗi màn tự cắm một dải chữ dưới tiêu đề để báo "Đã lưu" hay "Thao tác thất
 * bại". Ba vấn đề, cái nào cũng thật: dải chữ đó đẩy nội dung xuống mỗi lần xuất hiện,
 * nó nằm ở đầu trang trong khi mắt người dùng đang ở chỗ vừa bấm, và nó không bao giờ tự
 * mất nên màn hình đọng lại thông báo của một việc đã xong từ lâu.
 *
 * Đây CHỈ dành cho thông báo trôi qua được. Trạng thái còn phải xử lý — danh sách tải
 * hỏng, một trường nhập sai, lý do nội dung bị trả về — vẫn ở lại tại chỗ của nó: người
 * dùng cần nó lúc họ nhìn tới, không phải trong bốn giây sau khi bấm.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = (nextId.current += 1);
    // Ba cái là hết chỗ trên màn hình; cái thứ tư đẩy cái cũ nhất đi thay vì xếp chồng
    // ra ngoài khung nhìn.
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* `aria-live` ở khung chứ không ở từng thẻ: trình đọc màn hình phải thấy vùng này
          tồn tại từ trước thì mới đọc nội dung mới thêm vào. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} onDismiss={() => dismiss(toast.id)} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { className, icon: Icon } = TONES[toast.tone];

  useEffect(() => {
    const timer = setTimeout(onDismiss, LIFETIME[toast.tone]);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.tone]);

  return (
    <div
      className={`animate-modal-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.24)] ${className}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>
      <button
        aria-label="Đóng thông báo"
        className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded hover:bg-foreground/10"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * Không ném khi thiếu provider: một thông báo không hiện ra là phiền, còn một trang trắng
 * vì thiếu provider thì tệ hơn hẳn thứ nó đang định báo.
 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NO_PROVIDER;
}

const NO_PROVIDER: ToastApi = {
  success: (message) => console.warn("[toast] thiếu <ToastProvider>:", message),
  error: (message) => console.warn("[toast] thiếu <ToastProvider>:", message),
  info: (message) => console.warn("[toast] thiếu <ToastProvider>:", message),
};
