"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Bot, Plus } from "lucide-react";
import { CodeyComposer } from "./codey-composer";
import { CodeyHistoryMenu } from "./codey-history-menu";
import { useCodey } from "./session-store";

/** Gợi ý mở đầu. Câu về test chỉ hiện khi thật sự có test hỏng — nếu không nó là một lời mời
 *  dẫn tới câu trả lời "bạn chưa chạy bài nào cả". */
const CHIPS = [
  { text: "Gợi ý hướng tiếp cận", needsFailure: false },
  { text: "Giải thích đề bài giúp mình", needsFailure: false },
  { text: "Review code hiện tại của mình", needsFailure: false },
  { text: "Vì sao test của mình chưa đạt?", needsFailure: true },
  { text: "Code của mình có độ phức tạp bao nhiêu?", needsFailure: false },
];

export function CodeyPanel() {
  const { messages, sending, send, newSession, mascotVisible, toggleMascot, hasFailingRun } =
    useCodey();
  const endRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống khi có tin mới hoặc khi Codey bắt đầu trả lời — nếu không, câu trả lời mọc ra
  // bên dưới mép khung và người dùng tưởng chưa có gì.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, sending]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border-soft px-2 py-1.5">
        <button
          type="button"
          title="Hội thoại mới"
          aria-label="Hội thoại mới"
          onClick={newSession}
          className="flex size-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg hover:text-navy"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
        <CodeyHistoryMenu />
        <button
          type="button"
          title={mascotVisible ? "Ẩn mascot Codey" : "Hiện mascot Codey"}
          aria-label={mascotVisible ? "Ẩn mascot Codey" : "Hiện mascot Codey"}
          aria-pressed={mascotVisible}
          onClick={toggleMascot}
          className={`flex size-7 items-center justify-center rounded-md transition-colors ${
            mascotVisible
              ? "bg-primary-tint text-primary"
              : "text-text-muted hover:bg-bg hover:text-navy"
          }`}
        >
          <Bot aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <EmptyState onPick={send} hasFailingRun={hasFailingRun} />
        ) : (
          <div className="space-y-3">
            {messages.map((message) =>
              message.from === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-navy px-3 py-2 text-xs leading-5 text-on-ink">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex gap-2">
                  <span className="mascot-sprite mt-0.5 size-6 shrink-0" />
                  <div className="rich-text min-w-0 flex-1 text-xs leading-6 [&_pre]:overflow-x-auto">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{message.text}</ReactMarkdown>
                  </div>
                </div>
              ),
            )}
            {sending && (
              <div className="flex items-center gap-2 text-2xs text-text-faint">
                <span className="mascot-sprite size-6" style={{ backgroundPosition: "100% 0%" }} />
                Codey đang suy nghĩ…
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <CodeyComposer onSend={send} disabled={sending} />
    </div>
  );
}

/** Màn hình rỗng: một lời mời và vài chip, không phải một khung trắng. */
function EmptyState({
  onPick,
  hasFailingRun,
}: {
  onPick: (text: string) => void;
  hasFailingRun: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-3 text-center">
      <span className="mascot-sprite mascot-sprite-idle size-16" />
      <p className="mt-3 text-sm font-bold text-navy">Bí ở đâu? Codey gợi ý từng bước.</p>
      <p className="mt-1.5 max-w-[19rem] text-2xs leading-5 text-text-muted">
        Codey đọc đề bài, code bạn đang viết và kết quả chạy gần nhất — rồi chỉ hướng, không đưa
        lời giải hoàn chỉnh.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {CHIPS.filter((chip) => !chip.needsFailure || hasFailingRun).map((chip) => (
          <button
            key={chip.text}
            type="button"
            onClick={() => onPick(chip.text)}
            className="rounded-full border border-border px-2.5 py-1.5 text-2xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            {chip.text}
          </button>
        ))}
      </div>
    </div>
  );
}
