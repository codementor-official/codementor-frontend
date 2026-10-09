"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Bot, FileText, Lightbulb, Loader2, Plus, Send, Square } from "lucide-react";
import { FieldError, fieldA11y, Modal } from "@codementor/ui";
import { length } from "@codementor/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AgentMarkdown } from "@/features/agent-chat/agent-markdown";
import { EXPLAIN, QUOTES, splitAnswer } from "./answer-format";
import { useTutor, type TutorItem } from "./tutor-store";
import type { AiCitation, TutorTurn } from "./types";

const SUGGESTIONS = [
  { title: "Tóm tắt ý chính", prompt: "Tóm tắt các ý chính trong tài liệu đã chọn, kèm nguồn trích dẫn." },
  {
    title: "Giải thích dễ hiểu",
    prompt: "Giải thích khái niệm quan trọng trong tài liệu bằng ngôn ngữ dễ hiểu và trích dẫn nguồn.",
  },
  {
    title: "Câu hỏi ôn tập",
    prompt: "Soạn 3 câu hỏi ôn tập tăng dần độ khó dựa trên tài liệu đã chọn. Trích dẫn nguồn và chưa đưa đáp án.",
  },
];

const BOT_AVATAR = "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-on-ink";
const BOT_BUBBLE =
  "min-w-0 flex-1 space-y-3 rounded-2xl rounded-bl-md border border-border-soft bg-surface p-4";

/**
 * Khung chat của Trợ lý AI. Ô soạn do màn hình cha giữ (`input`) để các nút gợi ý ở cột bên
 * điền vào được, và để câu hỏi còn nguyên khi lượt gửi hỏng.
 */
export function TutorChat({
  slug,
  ready,
  input,
  setInput,
  composerRef,
  notice,
}: {
  slug: string;
  ready: boolean;
  input: string;
  setInput: (value: string) => void;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Dòng nhắc trạng thái cấu hình (chưa có OpenAI key…), do màn hình cha quyết định. */
  notice: React.ReactNode;
}) {
  const tutor = useTutor();
  const [citation, setCitation] = useState<AiCitation | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  // `AskAiDto.question` ≤ 4000 cũ, giữ nguyên trần. Không đếm ký tự — chỉ báo khi quá.
  const inputError = length(input, "Câu hỏi", { max: 4000 });
  const last = tutor.items.at(-1);
  const busy = tutor.running || tutor.opening;
  const canSend =
    tutor.enabled && ready && !busy && tutor.selected.length > 0 && Boolean(input.trim()) && !inputError;

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [tutor.items.length, last?.text, last?.turn, tutor.step]);

  async function send() {
    if (!canSend) return;
    const question = input.trim();
    setInput("");
    // Hỏng trước khi có chữ (quyền, hạn mức, tài liệu hỏng): trả câu hỏi về ô soạn.
    if (!(await tutor.send(question))) setInput(question);
  }

  return (
    <Card className="order-1 flex h-[calc(100dvh-10rem)] min-h-[36rem] min-w-0 flex-col overflow-hidden lg:sticky lg:top-0 lg:h-[calc(100dvh-10.5rem)] lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-tint">
            <Bot className="size-4 text-primary" />
          </span>
          Trò chuyện với trợ lý
        </h2>
        <Button variant="ghost" size="sm" disabled={busy || !tutor.enabled} onClick={tutor.newSession}>
          <Plus className="size-4" />
          Hội thoại mới
        </Button>
      </div>
      <div
        ref={scroll}
        role="log"
        aria-label="Nội dung hội thoại"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-bg/55 p-5"
      >
        {tutor.opening ? (
          <p role="status" className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="size-4 animate-spin" />
            Đang mở hội thoại...
          </p>
        ) : (
          <>
            {!tutor.items.length && <Welcome />}
            {tutor.items.map((item) => (
              <div key={item.id} className="space-y-4">
                <div className="flex justify-end">
                  <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-navy px-4 py-3 text-sm leading-6 text-on-ink">
                    {item.question}
                  </p>
                </div>
                <Answer item={item} step={tutor.step} sources={tutor.sources} onCite={setCitation} />
              </div>
            ))}
          </>
        )}
      </div>
      <div className="shrink-0 space-y-3 border-t border-border-soft bg-surface p-4">
        {notice}
        {tutor.error && (
          <p role="alert" className="text-sm text-danger">
            {tutor.error} Câu hỏi của bạn vẫn được giữ lại để gửi lại.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.title}
              disabled={busy}
              onClick={() => {
                setInput(item.prompt);
                composerRef.current?.focus();
              }}
              className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary hover:bg-primary-tint disabled:opacity-50"
            >
              {item.title}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="flex items-end gap-2"
        >
          <div className="min-w-0 flex-1">
            <textarea
              {...fieldA11y("ai-tutor-question", inputError)}
              ref={composerRef}
              aria-label="Câu hỏi cho trợ lý"
              value={input}
              rows={2}
              disabled={busy}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Bạn muốn hiểu gì trong tài liệu?"
              className="block w-full min-w-0 resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-text-faint"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <FieldError className="mt-1 text-xs" error={inputError} htmlFor="ai-tutor-question" />
          </div>
          {tutor.running ? (
            <Button type="button" variant="outline" onClick={tutor.stop}>
              <Square className="size-4" />
              Dừng
            </Button>
          ) : (
            <Button type="submit" disabled={!canSend}>
              <Send className="size-4" />
              Gửi
            </Button>
          )}
        </form>
        <p className="text-xs text-text-faint">
          {!tutor.enabled
            ? "Chọn nhóm học tập để bắt đầu."
            : !tutor.selected.length
              ? "Chọn ít nhất một tài liệu làm nguồn trả lời."
              : `${tutor.selected.length} tài liệu được chọn · Enter để gửi · Shift + Enter để xuống dòng`}
        </p>
      </div>
      <CitationModal slug={slug} citation={citation} onClose={() => setCitation(null)} />
    </Card>
  );
}

function Welcome() {
  return (
    <div className="flex gap-2.5">
      <span className={BOT_AVATAR}>
        <Bot className="size-3.5" />
      </span>
      <div className="space-y-2 rounded-2xl rounded-bl-md border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-text">
        <p className="font-semibold text-navy">Chào bạn! Hôm nay mình cùng học gì nhé?</p>
        <p>
          Chọn nhóm và tài liệu ở phần bên cạnh, rồi hỏi mình điều bạn muốn hiểu. Mình sẽ đọc tài
          liệu, giải thích và chỉ rõ nguồn để bạn đối chiếu.
        </p>
        <p className="text-xs text-text-muted">
          Bạn có thể thêm hoặc đổi tài liệu bất cứ lúc nào — mỗi câu hỏi dùng đúng những tài liệu
          đang được chọn.
        </p>
      </div>
    </div>
  );
}

/** Một câu trả lời: đã đối chiếu, đang chảy, hoặc một câu thông báo khi lượt dừng sớm. */
function Answer({
  item,
  step,
  sources,
  onCite,
}: {
  item: TutorItem;
  step: string;
  sources: AiCitation[];
  onCite: (citation: AiCitation) => void;
}) {
  if (item.turn) return <GroundedAnswer turn={item.turn} onCite={onCite} />;
  if (item.live) return <LiveAnswer text={item.text} step={step} sources={sources} />;
  // Lượt dừng trước khi trả lời (tài liệu chưa xong, bị dừng tay): câu thông báo của server,
  // hoặc không có gì nếu lượt hỏng trước chữ đầu tiên.
  if (!item.text.trim()) return null;
  return (
    <div className="flex min-w-0 gap-2.5">
      <span className={BOT_AVATAR}>
        <Bot className="size-3.5" />
      </span>
      <div className={BOT_BUBBLE}>
        <AgentMarkdown content={item.text.replaceAll(QUOTES, "").replaceAll(EXPLAIN, "").trim()} />
      </div>
    </div>
  );
}

/** Lượt đã đối chiếu — đúng bố cục hai khối của AI Tutor cũ. */
function GroundedAnswer({ turn, onCite }: { turn: TutorTurn; onCite: (citation: AiCitation) => void }) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <span className={BOT_AVATAR}>
        <Bot className="size-3.5" />
      </span>
      <div className={BOT_BUBBLE}>
        {!!turn.citations.length && <p className="text-xs font-semibold text-primary">Từ tài liệu của bạn</p>}
        <AgentMarkdown content={turn.answer} />
        {!!turn.citations.length && (
          <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
            {turn.citations.map((source) => (
              <button
                key={source.sourceId}
                type="button"
                onClick={() => onCite(source)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-primary-tint px-2 py-1 text-left text-xs text-primary transition-colors hover:bg-border-soft"
              >
                <FileText className="size-3 shrink-0" />
                <span className="break-words">
                  [{source.sourceId}] {source.title}
                  {source.page ? ` · Trang/slide ${source.page}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
        {turn.supplementalAnswer && <Supplemental content={turn.supplementalAnswer} />}
      </div>
    </div>
  );
}

function Supplemental({ content }: { content: string }) {
  return (
    <section className="space-y-2 rounded-lg border border-primary/20 bg-primary-tint p-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Lightbulb className="size-3.5" />
        Giải thích & mở rộng
      </h3>
      <p className="text-2xs text-text-muted">
        Phần diễn giải của AI; ví dụ và kiến thức bổ sung không phải trích nguyên văn từ tài liệu.
      </p>
      <AgentMarkdown content={content} />
    </section>
  );
}

/**
 * Lượt đang chạy. Trước chữ đầu tiên: dòng bước + chip nguồn vừa tìm được. Sau đó: hai khối
 * vẽ từ chữ đang chảy. Trích dẫn ở đây CHƯA đối chiếu nên vẽ nhạt và ghi rõ — khối "Từ tài
 * liệu của bạn" chỉ xuất hiện khi server đã kiểm từng câu.
 */
function LiveAnswer({ text, step, sources }: { text: string; step: string; sources: AiCitation[] }) {
  const { quotes, explanation } = splitAnswer(text);
  return (
    <div className="flex min-w-0 gap-2.5">
      <span className={BOT_AVATAR}>
        <Bot className="size-3.5" />
      </span>
      <div className={BOT_BUBBLE}>
        {step && (
          <p role="status" className="flex items-center gap-2 text-xs text-text-muted">
            <Loader2 className="size-3.5 animate-spin" />
            {step}
          </p>
        )}
        {!!sources.length && !text && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((source) => (
              <span
                key={source.sourceId}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-border-soft px-2 py-0.5 text-2xs text-text-muted"
              >
                <FileText className="size-3 shrink-0" />
                <span className="truncate">
                  [{source.sourceId}] {source.title}
                  {source.page ? ` · ${source.page}` : ""}
                </span>
              </span>
            ))}
          </div>
        )}
        {!!quotes.length && (
          <div className="space-y-2 opacity-70">
            <p className="text-xs font-semibold text-text-muted">Trích dẫn · đang đối chiếu với tài liệu</p>
            {quotes.map((item, index) => (
              <blockquote key={index} className="border-l-2 border-border pl-3 text-sm leading-7 text-text">
                {item.quote}
                {item.sourceId ? ` [${item.sourceId}]` : ""}
              </blockquote>
            ))}
          </div>
        )}
        {explanation && <Supplemental content={explanation} />}
      </div>
    </div>
  );
}

function CitationModal({
  slug,
  citation,
  onClose,
}: {
  slug: string;
  citation: AiCitation | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(citation)}
      onClose={onClose}
      title={citation ? `[${citation.sourceId}] ${citation.title}` : "Nguồn tài liệu"}
      description={
        citation?.page ? `Trích đoạn ở trang/slide ${citation.page}` : "Trích đoạn được dùng làm nguồn trả lời"
      }
      width="lg"
    >
      <div className="space-y-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-text">{citation?.excerpt}</p>
        <Button href={`/workspace/${encodeURIComponent(slug)}?tab=documents`} variant="outline">
          <BookOpen className="size-4" />
          Mở tài liệu trong nhóm
        </Button>
      </div>
    </Modal>
  );
}
