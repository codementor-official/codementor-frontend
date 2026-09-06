"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Code2, Plus, Route, X } from "lucide-react";
import { CopilotChatInput } from "@copilotkit/react-core/v2";
import { AttachPicker } from "./attach-picker";
import {
  ATTACH_LABELS,
  useAttachedContent,
  type AttachKind,
  type AttachedItem,
} from "./use-attached-content";

/**
 * Ô nhập của Lecter: `CopilotChatInput` gốc, thêm menu đính kèm và hàng chip.
 *
 * Vì sao phải là một slot chứ không phải prop trên `<CopilotChat>`: `CopilotChat` đặt
 * `inputValue`, `onInputChange` và `onSubmitMessage` SAU khi trải `...restProps`, nên ba prop đó
 * truyền từ ngoài vào bị ghi đè im lặng. Slot `input` là chỗ duy nhất nhận được hàm gửi thật để
 * bọc lại.
 *
 * Nút `+` là slot `addMenuButton` chứ không còn là `toolsMenu` dựng sẵn của CopilotKit.
 *
 * Đổi vì `ToolsMenuItem.label` khai kiểu `string` và CopilotKit thật sự ĐỐI XỬ với nó như chuỗi:
 * `filteredCommands` gọi `item.label.toLowerCase()` để lọc menu lệnh gạch chéo. Truyền một
 * ReactNode vào đó thì dropdown vẫn vẽ đúng icon, nhưng người soạn gõ "/" rồi một ký tự nữa là ô
 * nhập ném `label.toLowerCase is not a function`. Không có khe nào khác để nhét icon vào.
 *
 * Bỏ `toolsMenu` cũng bỏ luôn menu gạch chéo — `commandItems` rỗng thì `updateSlashState` không
 * bao giờ bật nó. Đó là thứ chưa ai dùng: nó chỉ lặp lại đúng ba mục của nút `+`.
 *
 * Đổi lại được một tầng bấm: ba loại nội dung nằm phẳng thay vì nấp sau submenu "Đính kèm".
 */

/** Cùng bộ icon với thanh điều hướng: `Route` là lộ trình ở mọi màn khác của app. */
const ICONS: Record<AttachKind, typeof Code2> = {
  exercise: Code2,
  course: BookOpen,
  roadmap: Route,
};

const ATTACH_KINDS = ["exercise", "course", "roadmap"] as const;

/**
 * Menu đính kèm: nút `+` cộng một bảng chọn ba loại nội dung.
 *
 * Portal ra `body` và định vị bằng `getBoundingClientRect`, cùng lý do đã ghi ở `AttachPicker`:
 * ô nhập nằm trong một khung `pointer-events-none` + `absolute z-20`, nên một bảng chọn đặt tại
 * chỗ có thể bị cắt hoặc nằm dưới lớp khác. Mở LÊN TRÊN vì ô nhập nằm sát đáy màn hình.
 */
function AttachMenu({ onPick }: { onPick: (kind: AttachKind) => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKeyDown);
    // `scroll` với `capture`: khung chat cuộn trong chính nó, sự kiện không nổi lên `window`.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", close);
    };
  }, [rect]);

  return (
    <>
      <button
        aria-expanded={rect !== null}
        aria-haspopup="menu"
        aria-label="Đính kèm nội dung"
        className="pointer-events-auto ml-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={() =>
          setRect((open) => (open ? null : (buttonRef.current?.getBoundingClientRect() ?? null)))
        }
        ref={buttonRef}
        type="button"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>

      {rect &&
        createPortal(
          <div
            className="fixed z-50 w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            // `mousedown` trên document đóng menu; chặn ở đây để bấm vào chính nó không đóng
            // trước khi `click` của mục kịp chạy.
            onMouseDown={(event) => event.stopPropagation()}
            role="menu"
            style={{ bottom: window.innerHeight - rect.top + 8, left: rect.left }}
          >
            {ATTACH_KINDS.map((kind) => {
              const Icon = ICONS[kind];
              return (
                <button
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                  key={kind}
                  onClick={() => {
                    setRect(null);
                    onPick(kind);
                  }}
                  role="menuitem"
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                  {ATTACH_LABELS[kind]}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

function ChipBar({ items, onRemove }: { items: AttachedItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    // `pointer-events-auto`: khung chứa ô nhập của CopilotChatView là `pointer-events-none`,
    // mỗi phần tử con phải tự bật lại thì nút × mới bấm được.
    <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-wrap gap-1.5 px-4 pb-1.5">
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        return (
          <span
            className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs"
            key={item.id}
          >
            <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title}</span>
            <button
              aria-label={`Bỏ đính kèm ${item.title}`}
              className="shrink-0 rounded text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(item.id)}
              type="button"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

function Composer(props: ComponentProps<typeof CopilotChatInput>) {
  const { items, attach, remove, clear, serialize } = useAttachedContent();
  const [picker, setPicker] = useState<AttachKind | null>(null);

  // Danh tính PHẢI ổn định: slot là một component type, nên một arrow dựng inline sẽ là type mới
  // ở mỗi render và React tháo rồi dựng lại cả nút — bảng chọn đang mở sẽ tự đóng ngay khi người
  // soạn gõ thêm một ký tự. `setPicker` là setState nên deps rỗng là đủ.
  const addMenuButton = useCallback(
    () => <AttachMenu onPick={setPicker} />,
    [],
  ) as unknown as typeof CopilotChatInput.AddMenuButton;

  const { onSubmitMessage } = props;
  // Giữ nguyên `undefined` khi agent chưa sẵn sàng. Luôn trả về một hàm sẽ làm nút Gửi sáng lên
  // trước lúc gửi được (`canSend` chỉ kiểm `!!onSubmitMessage`).
  const submit = onSubmitMessage
    ? (value: string) => {
        onSubmitMessage(value + serialize());
        clear();
      }
    : undefined;

  return (
    <>
      <ChipBar items={items} onRemove={remove} />
      <CopilotChatInput
        {...props}
        addMenuButton={addMenuButton}
        onSubmitMessage={submit}
      />
      <AttachPicker
        attachedIds={items.map((item) => item.id)}
        kind={picker}
        onClose={() => setPicker(null)}
        onPick={attach}
      />
    </>
  );
}

/**
 * Kiểu của slot là `SlotValue<typeof CopilotChatInput>`, tức đòi cả những static gắn trên
 * namespace (`SendButton`, `TextArea`, …) chứ không chỉ chữ ký component. Chép chúng sang đây là
 * chín dòng mà không ai đọc: `renderSlotElement` chỉ gọi `React.createElement(slot, props)` và
 * không bao giờ chạm tới static của slot.
 */
export const LecterComposer = Composer as unknown as typeof CopilotChatInput;
