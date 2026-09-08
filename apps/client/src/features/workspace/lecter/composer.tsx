"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { FileText, Loader2, X } from "lucide-react";
import { CopilotChatInput } from "@copilotkit/react-core/v2";
import { useToast } from "@codementor/ui";
import { MAX_ATTACHMENTS, prepareDocument, serializeAttachments } from "./attach";
import { useLecterContext } from "./context";
import { LecterDocumentMenu } from "./document-menu";
import type { LecterAttachment } from "./types";

/**
 * Ô nhập của Lecter: `CopilotChatInput` gốc, thêm menu tài liệu và hàng chip.
 *
 * Vì sao phải là một slot chứ không phải prop trên `<CopilotChat>`: `CopilotChat` đặt
 * `inputValue`, `onInputChange` và `onSubmitMessage` SAU khi trải `...restProps`, nên ba prop đó
 * truyền từ ngoài vào bị ghi đè im lặng. Slot `input` là chỗ duy nhất nhận được hàm gửi thật để
 * bọc lại — và ở đây "bọc lại" nghĩa là ghép danh sách tài liệu đính kèm vào cuối tin nhắn.
 */
function ChipBar({
  items,
  onRemove,
}: {
  items: LecterAttachment[];
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    // `pointer-events-auto`: khung chứa ô nhập của CopilotChatView là `pointer-events-none`,
    // mỗi phần tử con phải tự bật lại thì nút × mới bấm được.
    <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-wrap gap-1.5 px-4 pb-1.5">
      {items.map((item) => (
        <span
          key={item.id}
          className="flex max-w-full items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2 py-1 text-xs"
        >
          {item.state === "indexing" ? (
            <Loader2 aria-hidden="true" className="size-3.5 shrink-0 animate-spin text-text-muted" />
          ) : (
            <FileText
              aria-hidden="true"
              className={`size-3.5 shrink-0 ${item.state === "failed" ? "text-danger" : "text-text-muted"}`}
            />
          )}
          <span className={`truncate ${item.state === "failed" ? "text-danger" : "text-navy"}`}>
            {item.title}
          </span>
          {item.state === "indexing" && (
            <span className="shrink-0 text-text-faint">đang xử lý…</span>
          )}
          {item.state === "failed" && <span className="shrink-0 text-danger">không đọc được</span>}
          <button
            type="button"
            aria-label={`Bỏ đính kèm ${item.title}`}
            onClick={() => onRemove(item.id)}
            className="shrink-0 rounded text-text-muted hover:text-navy"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

function Composer(props: ComponentProps<typeof CopilotChatInput>) {
  const { slug } = useLecterContext();
  const toast = useToast();
  const [items, setItems] = useState<LecterAttachment[]>([]);

  // Huỷ mọi vòng chờ đang chạy khi ô nhập bị tháo — người soạn đóng drawer giữa chừng thì không
  // còn ai đọc kết quả, và một vòng poll sống sót sẽ gọi API mãi.
  const aborts = useRef<AbortController[]>([]);
  useEffect(
    () => () => {
      for (const controller of aborts.current) controller.abort();
    },
    [],
  );

  const remove = useCallback(
    (id: string) => setItems((previous) => previous.filter((item) => item.id !== id)),
    [],
  );

  const attach = useCallback(
    async (document: { id: string; title: string }) => {
      let added = false;
      setItems((previous) => {
        if (previous.some((item) => item.id === document.id)) return previous;
        if (previous.length >= MAX_ATTACHMENTS) return previous;
        added = true;
        return [...previous, { ...document, state: "indexing" }];
      });
      if (!added) {
        toast.error(`Mỗi lượt gửi tối đa ${MAX_ATTACHMENTS} tài liệu.`);
        return;
      }
      const controller = new AbortController();
      aborts.current.push(controller);
      try {
        const state = await prepareDocument(slug, document.id, controller.signal);
        setItems((previous) =>
          previous.map((item) => (item.id === document.id ? { ...item, state } : item)),
        );
        if (state === "failed") toast.error(`Không đọc được "${document.title}".`);
      } catch (error) {
        if (controller.signal.aborted) return;
        setItems((previous) =>
          previous.map((item) => (item.id === document.id ? { ...item, state: "failed" } : item)),
        );
        toast.error(error instanceof Error ? error.message : "Không xử lý được tài liệu.");
      }
    },
    [slug, toast],
  );

  // Danh tính PHẢI ổn định giữa các lần render có cùng dữ liệu: slot là một component TYPE, nên
  // một arrow dựng inline là type mới mỗi render và React tháo rồi dựng lại cả nút — bảng chọn
  // đang mở sẽ tự đóng ngay khi người soạn gõ thêm một ký tự.
  const addMenuButton = useCallback(
    () => (
      <LecterDocumentMenu
        slug={slug}
        selected={items.map(({ id, title }) => ({ id, title }))}
        onPick={(document) => void attach(document)}
        onRemove={remove}
      />
    ),
    [attach, items, remove, slug],
  ) as unknown as typeof CopilotChatInput.AddMenuButton;

  // Tài liệu chưa xử lý xong thì Lecter đọc ra rỗng rồi nói sai với người soạn. Khoá nút Gửi
  // bằng cách bỏ hẳn `onSubmitMessage`: `canSend` chỉ kiểm `!!onSubmitMessage`.
  const waiting = items.some((item) => item.state === "indexing");
  const { onSubmitMessage } = props;
  const submit =
    onSubmitMessage && !waiting
      ? (value: string) => {
          onSubmitMessage(value + serializeAttachments(items));
          setItems([]);
        }
      : undefined;

  return (
    <>
      <ChipBar items={items} onRemove={remove} />
      <CopilotChatInput {...props} addMenuButton={addMenuButton} onSubmitMessage={submit} />
    </>
  );
}

/**
 * Kiểu của slot là `SlotValue<typeof CopilotChatInput>`, tức đòi cả những static gắn trên
 * namespace (`SendButton`, `TextArea`, …) chứ không chỉ chữ ký component. Chép chúng sang đây là
 * chín dòng mà không ai đọc: `renderSlotElement` chỉ gọi `React.createElement(slot, props)`.
 */
export const LecterComposer = Composer as unknown as typeof CopilotChatInput;
