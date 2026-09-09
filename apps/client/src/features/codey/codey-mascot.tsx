"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";
import { useWorkspace } from "@codementor/ui";
import type { MascotState } from "./types";
import { useCodey } from "./session-store";

const POSITION_KEY = "codey:mascot-position";
const SIZE = 56;
const MARGIN = 24;
/** Nút chat nhóm đã chiếm sẵn góc dưới bên trái. */
const FAB_CLEARANCE = 72;
/** Dưới ngưỡng này thì cú thả chuột là một cú BẤM, không phải một cú kéo. Ngón tay không bao
 *  giờ đứng yên tuyệt đối, nên so sánh với 0 sẽ biến mọi cú chạm thành kéo. */
const DRAG_SLOP = 4;

const spritePosition: Record<Exclude<MascotState, "idle">, string> = {
  thinking: "100% 0%",
  typing: "0% 50%",
  loading: "33.333% 50%",
  success: "66.666% 50%",
  error: "100% 50%",
};

const stateCopy: Record<MascotState, string> = {
  idle: "Codey đang ngồi cạnh bạn.",
  thinking: "Codey đang suy nghĩ…",
  typing: "Cứ code tiếp, mình không làm phiền.",
  loading: "Đang chạy test…",
  success: "Tất cả test đều đạt!",
  error: "Có test chưa đạt.",
};

interface Point {
  x: number;
  y: number;
}

/**
 * Chỗ đứng lần đầu: mép TRÁI, trên nút chat nhóm một khoảng.
 *
 * Góc dưới bên phải là chỗ tự nhiên cho một bong bóng nổi, nhưng ở trang này nó rơi đúng lên ô
 * nhập của sidebar Codey và che mất nút gửi. Bên trái là pane đề bài — chữ, không có nút nào —
 * và `FAB_CLEARANCE` chừa chỗ cho nút chat nhóm vốn đã ngồi sẵn ở góc đó.
 */
function defaultPosition(): Point {
  return { x: MARGIN, y: window.innerHeight - SIZE - MARGIN - FAB_CLEARANCE };
}

function clampToViewport({ x, y }: Point): Point {
  return {
    x: Math.min(Math.max(x, MARGIN), Math.max(window.innerWidth - SIZE - MARGIN, MARGIN)),
    y: Math.min(Math.max(y, MARGIN), Math.max(window.innerHeight - SIZE - MARGIN, MARGIN)),
  };
}

/**
 * Bong bóng Codey — kéo thả được, và chỗ đặt được nhớ lại giữa các lần vào.
 *
 * Dùng Pointer Events chứ không phải HTML5 drag-and-drop: API kéo thả gốc sinh một ảnh ma mờ,
 * không bám con trỏ mượt, và không chạy trên cảm ứng nếu không khai thêm. `setPointerCapture`
 * cho ta cả ba thứ đó trong ~20 dòng, và chuột lẫn ngón tay đi chung một đường code.
 */
export function CodeyMascot() {
  const { mascotState, messages, invite, dismissInvite, askAboutRun, hideMascot } = useCodey();

  const { panes, openTab, setActive } = useWorkspace();
  const paneOpen = panes.ai.tabs.length > 0;

  const [position, setPosition] = useState<Point | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const seen = useRef<string | null>(null);

  // Vị trí đọc trong effect, không trong `useState(() => …)`: `window` không tồn tại lúc render
  // phía server, và `null` ở lượt đầu cũng là thứ giữ cho markup hai bên khớp nhau.
  useEffect(() => {
    let saved: Point | null = null;
    try {
      const raw = window.localStorage.getItem(POSITION_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<Point>) : null;
      if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
        saved = { x: parsed.x, y: parsed.y };
      }
    } catch {
      // Ô lưu hỏng hoặc bị chặn: rơi về góc dưới bên phải.
    }
    setPosition(clampToViewport(saved ?? defaultPosition()));
  }, []);

  // Thu nhỏ cửa sổ mà không kẹp lại thì bong bóng nằm ngoài màn hình và không có đường lấy lại.
  useEffect(() => {
    const onResize = () => setPosition((current) => (current ? clampToViewport(current) : current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Câu trả lời mới trong lúc sidebar đang đóng thì hiện ngay tại bong bóng — nếu không, học
  // viên bấm Codey rồi không thấy gì xảy ra. Sidebar đang mở thì họ đã đọc ở đó rồi.
  const last = messages[messages.length - 1];
  useEffect(() => {
    if (!last || last.from !== "codey" || last.id === seen.current) return;
    seen.current = last.id;
    if (!paneOpen) setPeek(last.text);
  }, [last, paneOpen]);

  const openPane = useCallback(() => {
    setPeek(null);
    if (paneOpen) setActive("ai", "ai");
    else openTab("ai", "ai");
  }, [openTab, paneOpen, setActive]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el || !position) return;
    const start = { x: event.clientX, y: event.clientY };
    const origin = position;
    dragged.current = false;
    el.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) dragged.current = true;
      setPosition(clampToViewport({ x: origin.x + dx, y: origin.y + dy }));
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.releasePointerCapture(event.pointerId);
      if (!dragged.current) return;
      setPosition((current) => {
        if (current) {
          try {
            window.localStorage.setItem(POSITION_KEY, JSON.stringify(current));
          } catch {
            // Không lưu được thì chỗ đặt chỉ sống trong tab này.
          }
        }
        return current;
      });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp, { once: true });
    el.addEventListener("pointercancel", onUp, { once: true });
  };

  /**
   * Bấm vào bong bóng = XIN GỢI Ý, không phải mở sidebar.
   *
   * Câu trả lời hiện ngay tại chỗ bong bóng đang đứng, và đồng thời vào hội thoại — mở sidebar
   * lúc nào cũng đọc lại được. Mở sidebar ngay ở đây thì bong bóng chỉ còn là một cái nút
   * trùng với nút đã có trên header, và phần "người bạn ngồi cạnh" biến mất.
   */
  const onClick = () => {
    // Vừa kéo xong thì `pointerup` cũng sinh ra một `click`. Bỏ qua nó, nếu không mỗi lần dời
    // chỗ bong bóng lại tiêu một lượt hỏi.
    if (dragged.current) return;
    // Đang hiện câu trả lời: bấm lần nữa để thu gọn lại.
    if (peek) {
      setPeek(null);
      return;
    }
    // `askAboutRun` tự bỏ lời mời, nên nó đúng cho cả hai trường hợp: vừa chạy hỏng, và đang
    // bí giữa chừng không có lần chạy nào.
    askAboutRun();
  };

  if (!position) return null;

  const above = position.y > window.innerHeight / 2;
  const alignRight = position.x > window.innerWidth / 2;

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      style={{ left: position.x, top: position.y }}
      className="group fixed z-40 touch-none select-none"
    >
      {(peek || invite) && (
        <div
          className={`absolute w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-border bg-surface p-3 shadow-modal ${
            above ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"
          } ${alignRight ? "right-0" : "left-0"}`}
        >
          {peek ? (
            <>
              <div className="rich-text max-h-32 overflow-hidden text-2xs leading-5 [&_pre]:overflow-x-auto">
                <ReactMarkdown>{peek}</ReactMarkdown>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={openPane}
                  className="text-2xs font-semibold text-primary hover:underline"
                >
                  Mở Codey để đọc tiếp
                </button>
                <button
                  type="button"
                  aria-label="Đóng gợi ý"
                  onClick={() => setPeek(null)}
                  className="rounded p-0.5 text-text-faint hover:text-navy"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-2xs leading-5 text-text">{invite}</p>
              <button
                type="button"
                aria-label="Bỏ qua gợi ý"
                onClick={dismissInvite}
                className="shrink-0 rounded p-0.5 text-text-faint hover:text-navy"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        title={invite ?? stateCopy[mascotState]}
        aria-label={invite ? `Codey: ${invite}` : "Mở Codey"}
        className="relative flex size-14 cursor-grab items-center justify-center rounded-full border border-border bg-surface shadow-dropdown transition-colors hover:border-primary active:cursor-grabbing"
      >
        <span
          className={`mascot-sprite size-12 ${mascotState === "idle" ? "mascot-sprite-idle" : ""}`}
          style={
            mascotState === "idle" ? undefined : { backgroundPosition: spritePosition[mascotState] }
          }
        />
        {invite && (
          <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-danger ring-2 ring-surface" />
        )}
      </button>

      <button
        type="button"
        aria-label="Ẩn mascot Codey"
        onClick={hideMascot}
        className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full border border-border bg-surface text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </div>
  );
}
