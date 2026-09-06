"use client";

import { useState, type ComponentProps } from "react";
import { BookOpen, Code2, X } from "lucide-react";
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
 * Nút `+` không phải đồ tự dựng: `CopilotChatInput` đã có `toolsMenu` và tự render dropdown (có cả
 * submenu). Trước đây nút đó hiện mà bấm không được vì `AddMenuButton` tự tắt khi danh sách rỗng.
 */

const ICONS: Record<AttachKind, typeof Code2> = { exercise: Code2, course: BookOpen };

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
        onSubmitMessage={submit}
        toolsMenu={[
          {
            label: "Đính kèm",
            items: (["exercise", "course"] as const).map((kind) => ({
              label: ATTACH_LABELS[kind],
              action: () => setPicker(kind),
            })),
          },
        ]}
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
