"use client";

import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GripVertical, X } from "lucide-react";

/** Hẹp hơn mức này thì trình soạn thảo trong drawer xuống dòng vỡ hết. */
const MIN_WIDTH = 420;
/** Chừa lại một mảng nền: kéo hết cỡ mà phủ kín màn thì không còn chỗ bấm để đóng. */
const EDGE_GAP = 72;
const DEFAULT_WIDTH = { default: 672, wide: 1152 } as const;
/** Một bước mũi tên. Kéo bằng bàn phím thì đây là đơn vị nhỏ nhất còn thấy được. */
const KEY_STEP = 32;

function clampWidth(px: number): number {
  return Math.round(
    Math.min(Math.max(px, MIN_WIDTH), window.innerWidth - EDGE_GAP),
  );
}

/** Reusable right-side detail surface. Keep long-running list context visible beneath it. */
export function SideDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: "default" | "wide";
}) {
  // `width` giờ chỉ là bề rộng KHỞI ĐIỂM; người dùng kéo được và lựa chọn đó được nhớ lại.
  // Nhớ theo biến thể chứ không nhớ chung một số: drawer soạn bài và drawer xem chi tiết
  // là hai nhu cầu khác nhau, gộp lại thì kéo bên này làm lệch bên kia.
  const storageKey = `codementor:drawer-width:${width}`;
  const [pixels, setPixels] = useState<number>(DEFAULT_WIDTH[width]);
  const [dragging, setDragging] = useState(false);

  // Đọc trong effect chứ không đọc lúc khởi tạo state: localStorage không tồn tại khi
  // render phía server, và một giá trị khác nhau giữa hai lần render là lỗi hydrate.
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved > 0) setPixels(clampWidth(saved));
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const remember = (next: number) => {
    setPixels(next);
    window.localStorage.setItem(storageKey, String(next));
  };

  // Con trỏ bị "bắt" vào tay nắm nên không cần nghe sự kiện ở window, và kéo nhanh ra
  // ngoài drawer cũng không tuột.
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging) setPixels(clampWidth(window.innerWidth - event.clientX));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    remember(pixels);
  };

  if (!open) return null;
  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex justify-end bg-ink-fixed/50"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        // `max-w-full` là thứ giữ cho drawer không tràn trên màn hẹp: bề rộng tính bằng
        // pixel ở trên, còn ở điện thoại thì nó bị chặn lại vừa khung.
        style={{ width: `${pixels}px` }}
        className={`animate-drawer-in relative flex h-full max-w-full flex-col bg-card shadow-[0_24px_60px_rgba(0,0,0,0.3)] ${dragging ? "select-none" : ""}`}
      >
        {/* Tay nắm ẩn ở màn hẹp: ở đó drawer đã chiếm trọn bề ngang, không còn gì để kéo. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để đổi bề rộng"
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft")
              remember(clampWidth(pixels + KEY_STEP));
            else if (event.key === "ArrowRight")
              remember(clampWidth(pixels - KEY_STEP));
            else return;
            event.preventDefault();
          }}
          className="group absolute inset-y-0 left-0 z-10 hidden w-3 -translate-x-1/2 cursor-col-resize items-center justify-center focus-visible:outline-none sm:flex"
        >
          <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-foreground/40 group-focus-visible:bg-foreground/60" />
          <GripVertical
            aria-hidden="true"
            className="absolute h-3.5 w-3.5 text-transparent transition-colors group-hover:text-muted-foreground"
          />
        </div>

        <header className="sticky top-0 z-10 flex shrink-0 items-start gap-4 border-b border-border bg-card px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-card px-4 py-3 sm:px-5">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
