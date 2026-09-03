"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  BookOpen,
  Bot,
  ChevronRight,
  FileText,
  History,
  Lightbulb,
  ListChecks,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { ConfirmButton, Modal, Select, useToast } from "@codementor/ui";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type {
  AiCitation,
  AiConversation,
  AiConversationSummary,
  AiDocument,
  AiPage,
} from "./types";
import { aiError, useAiResource } from "./use-ai-resource";
import { prepareDocuments } from "./prepare-documents";

const field =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy placeholder:text-text-faint";
const emptyPage = <T,>(): AiPage<T> => ({
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const learningTools = [
  {
    icon: BookOpen,
    title: "Tóm tắt tài liệu",
    description: "Ý chính và kiến thức cần nhớ",
    prompt: "Tóm tắt các ý chính trong tài liệu đã chọn, kèm nguồn trích dẫn.",
  },
  {
    icon: Lightbulb,
    title: "Gỡ rối khái niệm",
    description: "Diễn giải dễ hiểu, bám sát nguồn",
    prompt:
      "Giải thích khái niệm quan trọng trong tài liệu bằng ngôn ngữ dễ hiểu và trích dẫn nguồn.",
  },
  {
    icon: ListChecks,
    title: "Lập kế hoạch ôn tập",
    description: "Chia nhỏ nội dung cần ôn",
    prompt:
      "Từ tài liệu này, hãy chia nội dung thành các bước ôn tập và nêu kiến thức cần nhớ ở mỗi bước.",
  },
];
const exercises = [
  {
    title: "Một bài nền tảng",
    detail: "Ôn lại một khái niệm trong tài liệu",
    prompt:
      "Tạo một bài luyện tập nền tảng từ tài liệu đã chọn. Nêu yêu cầu và gợi ý, chưa đưa đáp án. Trích dẫn kiến thức dùng để ra bài.",
  },
  {
    title: "Bài vận dụng",
    detail: "Liên hệ các kiến thức vừa học",
    prompt:
      "Tạo một bài vận dụng từ kiến thức trong tài liệu, có yêu cầu rõ ràng và gợi ý. Trích dẫn nguồn, chưa đưa lời giải.",
  },
  {
    title: "Bộ 3 câu ôn tập",
    detail: "Tăng dần mức độ khó",
    prompt:
      "Soạn 3 câu hỏi ôn tập tăng dần độ khó dựa trên tài liệu đã chọn. Trích dẫn nguồn và chưa đưa đáp án.",
  },
];

export function AiTutorScreen() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Trợ lý AI cá nhân"
        subtitle="Một không gian để hỏi bài, hiểu tài liệu và ôn tập cùng trợ lý của bạn."
      />
      <TutorGroups key={user?.id ?? "anonymous"} />
    </div>
  );
}

function TutorGroups() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<{ slug: string; name: string } | null>(
    null,
  );
  const [locked, setLocked] = useState(false);
  const groups = useAiResource(
    `groups:${page}:${q}`,
    useCallback(
      () => api.workspaces.list({ scope: "mine", page, limit: 20, q }),
      [page, q],
    ),
  );
  const options =
    groups.data?.items.map((group) => ({
      value: group.slug,
      label: group.name,
    })) ?? [];
  if (chosen && !options.some((option) => option.value === chosen.slug))
    options.unshift({ value: chosen.slug, label: chosen.name });
  const picker = (
    <fieldset
      disabled={locked}
      className="min-w-0 space-y-3 disabled:opacity-60"
    >
      <Select
        label="Nhóm học tập"
        value={chosen?.slug ?? ""}
        onChange={(slug) => {
          const found = options.find((option) => option.value === slug);
          setChosen(found ? { slug, name: found.label } : null);
        }}
        options={[{ value: "", label: "Chọn nhóm của bạn" }, ...options]}
      />
      <details className="text-xs text-text-muted">
        <summary className="cursor-pointer">Tìm nhóm khác</summary>
        <input
          aria-label="Tìm nhóm của bạn"
          className={`${field} mt-2`}
          placeholder="Tên nhóm học tập..."
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        {groups.data && (
          <Pager
            page={page}
            totalPages={groups.data.totalPages}
            onChange={setPage}
          />
        )}
      </details>
      {groups.loading && (
        <p className="text-xs text-text-muted">Đang tải nhóm...</p>
      )}
      {groups.error && (
        <LoadError message={groups.error} retry={groups.refresh} />
      )}
      {groups.data && !groups.data.total && (
        <p className="text-xs text-text-muted">
          Chưa có nhóm phù hợp.{" "}
          <Link href="/workspace" className="text-primary">
            Tham gia nhóm học tập →
          </Link>
        </p>
      )}
    </fieldset>
  );
  return (
    <WorkspaceTutor
      key={chosen?.slug ?? "none"}
      slug={chosen?.slug ?? ""}
      name={chosen?.name ?? ""}
      picker={picker}
      setLocked={setLocked}
    />
  );
}

function WorkspaceTutor({
  slug,
  name,
  picker,
  setLocked,
}: {
  slug: string;
  name: string;
  picker: ReactNode;
  setLocked: (locked: boolean) => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [pending, setPending] = useState("");
  const [opening, setOpening] = useState(false);
  const [citation, setCitation] = useState<AiCitation | null>(null);
  const [chatError, setChatError] = useState("");
  const attempt = useRef<{
    id: string;
    question: string;
    conversationId: string;
  } | null>(null);
  const preparation = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const scroll = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const status = useAiResource(
    `status:${slug}`,
    useCallback(
      () => (slug ? api.ai.status(slug) : Promise.resolve(null)),
      [slug],
    ),
  );
  const documents = useAiResource(
    `documents:${slug}:${page}:${q}`,
    useCallback(
      () =>
        slug
          ? api.ai.documents(slug, { page, limit: 6, q })
          : Promise.resolve(emptyPage<AiDocument>()),
      [slug, page, q],
    ),
  );
  const history = useAiResource(
    `history:${slug}:${historyPage}`,
    useCallback(
      () =>
        slug
          ? api.ai.conversations(slug, historyPage)
          : Promise.resolve(emptyPage<AiConversationSummary>()),
      [slug, historyPage],
    ),
  );
  const selectedCount = Object.keys(selected).length;
  const ready = Boolean(status.data?.configured);
  const disabled = busy || opening;
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [conversation?.turns.length, pending, phase]);
  useEffect(() => {
    setLocked(disabled);
    return () => setLocked(false);
  }, [disabled, setLocked]);
  useEffect(
    () => () => {
      sequence.current += 1;
      preparation.current?.abort();
    },
    [],
  );

  function suggest(prompt: string) {
    setInput(prompt);
    composer.current?.focus();
  }
  function newChat() {
    sequence.current += 1;
    preparation.current?.abort();
    setConversation(null);
    setSelected({});
    setInput("");
    setChatError("");
    setOpening(false);
    attempt.current = null;
  }
  async function openChat(id: string) {
    const seq = ++sequence.current;
    setOpening(true);
    setChatError("");
    setConversation(null);
    setSelected({});
    try {
      const loaded = await api.ai.read(slug, id);
      if (seq !== sequence.current) return;
      setConversation(loaded);
      setSelected(
        Object.fromEntries(loaded.documents.map((doc) => [doc.id, doc.title])),
      );
      attempt.current = null;
    } catch (cause) {
      if (seq === sequence.current) setChatError(aiError(cause));
    } finally {
      if (seq === sequence.current) setOpening(false);
    }
  }
  async function send() {
    const question = input.trim();
    if (!question || !ready || disabled || !selectedCount) return;
    setBusy(true);
    setChatError("");
    setPending(question);
    setPhase("Đang chuẩn bị tài liệu...");
    const seq = sequence.current;
    const controller = new AbortController();
    preparation.current = controller;
    try {
      await prepareDocuments(
        slug,
        Object.keys(selected),
        controller.signal,
        (count, total) => {
          if (seq === sequence.current)
            setPhase(`Đang đọc tài liệu · ${count}/${total} sẵn sàng`);
        },
      );
      if (seq !== sequence.current) return;
      documents.refresh();
      setPhase("Trợ lý đang soạn câu trả lời...");
      const chat =
        conversation ?? (await api.ai.create(slug, Object.keys(selected)));
      if (seq !== sequence.current) return;
      setConversation(chat);
      if (
        !attempt.current ||
        attempt.current.question !== question ||
        attempt.current.conversationId !== chat.id
      )
        attempt.current = {
          id: crypto.randomUUID(),
          question,
          conversationId: chat.id,
        };
      const turn = await api.ai.ask(
        slug,
        chat.id,
        question,
        attempt.current.id,
      );
      if (seq !== sequence.current) return;
      setConversation({
        ...chat,
        turns: [...chat.turns.filter((item) => item.id !== turn.id), turn],
      });
      setInput("");
      attempt.current = null;
      history.refresh();
    } catch (cause) {
      if (seq === sequence.current && !controller.signal.aborted) {
        setChatError(aiError(cause));
        toast.error(aiError(cause));
      }
    } finally {
      if (seq === sequence.current) {
        setBusy(false);
        setPending("");
        setPhase("");
        preparation.current = null;
        documents.refresh();
      }
    }
  }
  async function remove(id: string) {
    try {
      await api.ai.remove(slug, id);
      if (conversation?.id === id) newChat();
      history.refresh();
      toast.success("Đã xóa hội thoại.");
    } catch (cause) {
      toast.error(aiError(cause));
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_280px_320px]">
      <Card className="order-1 flex h-[max(620px,calc(100dvh-205px))] max-h-[1000px] min-w-0 flex-col overflow-hidden lg:sticky lg:top-20 lg:row-span-2 2xl:row-span-1">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-tint">
              <Bot className="size-4 text-primary" />
            </span>
            Trò chuyện với trợ lý
          </h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={newChat}
          >
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
          {opening ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-text-muted"
            >
              <Loader2 className="size-4 animate-spin" />
              Đang mở hội thoại...
            </p>
          ) : (
            <>
              {!conversation?.turns.length && !pending && (
                <div className="flex gap-2.5">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-on-ink">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="space-y-2 rounded-2xl rounded-bl-md border border-border-soft bg-surface px-4 py-3 text-sm leading-6 text-text">
                    <p className="font-semibold text-navy">
                      Chào bạn! Hôm nay mình cùng học gì nhé?
                    </p>
                    <p>
                      Chọn nhóm và tài liệu ở phần bên cạnh, rồi hỏi mình điều
                      bạn muốn hiểu. Mình sẽ đọc tài liệu, giải thích và chỉ rõ
                      nguồn để bạn đối chiếu.
                    </p>
                    <p className="text-xs text-text-muted">
                      Bạn chỉ cần chọn tài liệu và gửi câu hỏi. Mọi bước chuẩn
                      bị được thực hiện tự động.
                    </p>
                  </div>
                </div>
              )}
              {conversation?.turns.map((turn) => (
                <div key={turn.id} className="space-y-4">
                  <div className="flex justify-end">
                    <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-navy px-4 py-3 text-sm leading-6 text-on-ink">
                      {turn.question}
                    </p>
                  </div>
                  <div className="flex min-w-0 gap-2.5">
                    <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-on-ink">
                      <Bot className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-bl-md border border-border-soft bg-surface p-4">
                      {!!turn.citations.length && (
                        <p className="text-xs font-semibold text-primary">
                          Từ tài liệu của bạn
                        </p>
                      )}
                      <div className="rich-text break-words text-sm leading-7 text-text [&_pre]:overflow-x-auto">
                        <ReactMarkdown
                          components={{
                            img: () => null,
                            a: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {turn.answer}
                        </ReactMarkdown>
                      </div>
                      {!!turn.citations.length && (
                        <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
                          {turn.citations.map((source) => (
                            <button
                              key={source.sourceId}
                              type="button"
                              onClick={() => setCitation(source)}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-primary-tint px-2 py-1 text-left text-xs text-primary transition-colors hover:bg-border-soft"
                            >
                              <FileText className="size-3 shrink-0" />
                              <span className="break-words">
                                [{source.sourceId}] {source.title}
                                {source.page
                                  ? ` · Trang/slide ${source.page}`
                                  : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {turn.supplementalAnswer && (
                        <section className="space-y-2 rounded-lg border border-primary/20 bg-primary-tint p-3">
                          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <Lightbulb className="size-3.5" />
                            Giải thích & mở rộng
                          </h3>
                          <p className="text-2xs text-text-muted">
                            Phần diễn giải của AI; ví dụ và kiến thức bổ sung
                            không phải trích nguyên văn từ tài liệu.
                          </p>
                          <div className="rich-text break-words text-sm leading-7 text-text [&_pre]:overflow-x-auto">
                            <ReactMarkdown
                              components={{
                                img: () => null,
                                a: ({ children }) => <span>{children}</span>,
                              }}
                            >
                              {turn.supplementalAnswer}
                            </ReactMarkdown>
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pending && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-navy px-4 py-3 text-sm text-on-ink">
                      {pending}
                    </p>
                  </div>
                  <p
                    role="status"
                    className="flex items-center gap-2 text-sm text-text-muted"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    {phase}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="shrink-0 space-y-3 border-t border-border-soft bg-surface p-4">
          {status.error && (
            <LoadError message={status.error} retry={status.refresh} />
          )}
          {status.data && !ready && (
            <p role="status" className="text-xs text-text-muted">
              Trợ lý chưa sẵn sàng. Vui lòng liên hệ quản trị viên hoặc{" "}
              <button
                onClick={status.refresh}
                className="font-semibold text-primary"
              >
                kiểm tra lại
              </button>
              .
            </p>
          )}
          {chatError && (
            <p role="alert" className="text-sm text-danger">
              {chatError} Câu hỏi của bạn vẫn được giữ lại để gửi lại.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {["Tóm tắt ý chính", "Giải thích dễ hiểu", "Câu hỏi ôn tập"].map(
              (title, i) => (
                <button
                  key={title}
                  disabled={disabled}
                  onClick={() =>
                    suggest(
                      i === 2 ? exercises[2].prompt : learningTools[i].prompt,
                    )
                  }
                  className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-primary hover:bg-primary-tint disabled:opacity-50"
                >
                  {title}
                </button>
              ),
            )}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={composer}
              aria-label="Câu hỏi cho trợ lý"
              value={input}
              rows={2}
              maxLength={4000}
              disabled={disabled}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Bạn muốn hiểu gì trong tài liệu?"
              className="min-w-0 flex-1 resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-text-faint"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              type="submit"
              disabled={!ready || disabled || !selectedCount || !input.trim()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Gửi
            </Button>
          </form>
          <p className="text-xs text-text-faint">
            {!slug
              ? "Chọn nhóm học tập để bắt đầu."
              : !selectedCount
                ? "Chọn ít nhất một tài liệu làm nguồn trả lời."
                : `${selectedCount} tài liệu được chọn · Enter để gửi · Shift + Enter để xuống dòng`}
          </p>
        </div>
      </Card>

      <aside className="order-3 min-w-0 space-y-4 lg:col-start-2 lg:row-start-2 2xl:row-start-1">
        <Card className="p-4">
          <h2 className="mb-1 text-sm font-bold text-navy">Học tiếp với AI</h2>
          <p className="mb-3 text-xs leading-relaxed text-text-muted">
            Chọn cách học. Trợ lý sẽ dựa vào tài liệu bạn chọn.
          </p>
          <div className="space-y-2">
            {learningTools.map((tool) => (
              <button
                key={tool.title}
                disabled={disabled}
                onClick={() => suggest(tool.prompt)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border-soft p-3 text-left transition-colors hover:border-primary hover:bg-primary-tint disabled:opacity-50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg text-primary">
                  <tool.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-xs text-navy">{tool.title}</b>
                  <span className="mt-0.5 block text-2xs text-text-faint">
                    {tool.description}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-text-faint" />
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <History className="size-4 text-primary" />
            Hội thoại của bạn
          </h2>
          <p className="mb-3 mt-1 text-xs text-text-muted">
            {name || "Lịch sử riêng theo từng nhóm học tập."}
          </p>
          {history.error && (
            <LoadError message={history.error} retry={history.refresh} />
          )}
          {history.loading && (
            <p className="py-3 text-xs text-text-muted">Đang tải lịch sử...</p>
          )}
          <ul className="max-h-72 divide-y divide-border-soft overflow-y-auto overscroll-contain">
            {history.data?.items.map((chat) => (
              <li
                key={chat.id}
                className={`flex items-center gap-1 rounded-md py-1 ${conversation?.id === chat.id ? "bg-primary-tint" : ""}`}
              >
                <button
                  disabled={disabled}
                  onClick={() => void openChat(chat.id)}
                  className="min-w-0 flex-1 rounded-md p-2 text-left transition-colors hover:bg-bg"
                >
                  <span className="block truncate text-xs font-medium text-navy">
                    {chat.title}
                  </span>
                  <time className="mt-1 block text-2xs text-text-faint">
                    {new Date(chat.updatedAt).toLocaleDateString("vi-VN")}
                  </time>
                </button>
                <ConfirmButton
                  disabled={disabled}
                  variant="ghost"
                  size="sm"
                  title="Xóa hội thoại?"
                  description="Lịch sử hỏi đáp này sẽ bị xóa khỏi tài khoản của bạn."
                  onConfirm={() => remove(chat.id)}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Xóa {chat.title}</span>
                </ConfirmButton>
              </li>
            ))}
          </ul>
          {history.data && !history.data.total && (
            <p className="py-3 text-xs text-text-muted">
              Chưa có hội thoại. Câu trả lời sẽ được lưu tại đây.
            </p>
          )}
          {history.data && (
            <Pager
              page={historyPage}
              totalPages={history.data.totalPages}
              onChange={setHistoryPage}
            />
          )}
        </Card>
      </aside>

      <aside className="order-2 min-w-0 space-y-4 lg:col-start-2 lg:row-start-1 2xl:col-start-3">
        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <FileText className="size-4 text-primary" />
            Tài liệu học cùng AI
          </h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-text-muted">
            Chọn nguồn đã được duyệt trong nhóm. Tài liệu được tự động chuẩn bị
            khi bạn gửi câu hỏi.
          </p>
          {picker}
          {!!slug && (
            <div className="mt-4 space-y-3 border-t border-border-soft pt-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-faint" />
                <input
                  aria-label="Tìm tài liệu đã duyệt"
                  className={`${field} pl-9`}
                  value={q}
                  onChange={(event) => {
                    setQ(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm tài liệu..."
                />
              </label>
              <p className="text-xs text-text-muted">
                Đã chọn {selectedCount}/8 · PDF, DOCX, PPTX, TXT, MD
              </p>
              {conversation && (
                <p className="text-xs text-primary">
                  Mở hội thoại mới để đổi tài liệu.
                </p>
              )}
              {!!selectedCount && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(selected).map(([id, title]) => (
                    <span
                      key={id}
                      className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary-tint px-2 py-1 text-xs text-primary"
                    >
                      <span className="truncate" title={title}>
                        {title}
                      </span>
                      {!conversation && (
                        <button
                          aria-label={`Bỏ chọn ${title}`}
                          disabled={disabled}
                          onClick={() =>
                            setSelected((current) => {
                              const next = { ...current };
                              delete next[id];
                              return next;
                            })
                          }
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {documents.loading && (
                <p className="py-3 text-xs text-text-muted">
                  Đang tải tài liệu...
                </p>
              )}
              {documents.error && (
                <LoadError
                  message={documents.error}
                  retry={documents.refresh}
                />
              )}
              <ul className="max-h-80 space-y-1 overflow-y-auto overscroll-contain">
                {documents.data?.items
                  .filter((doc) => doc.state !== "unsupported")
                  .map((doc) => (
                    <li key={doc.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-bg ${selected[doc.id] ? "border-primary/40 bg-primary-tint" : "border-border-soft"}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 shrink-0 accent-primary"
                          checked={Boolean(selected[doc.id])}
                          disabled={
                            disabled ||
                            Boolean(conversation) ||
                            (!selected[doc.id] && selectedCount >= 8)
                          }
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = { ...current };
                              if (event.target.checked)
                                next[doc.id] = doc.title;
                              else delete next[doc.id];
                              return next;
                            })
                          }
                        />
                        <span className="min-w-0">
                          <span className="block break-words text-xs font-medium text-navy">
                            {doc.title}
                          </span>
                          <span className="mt-1 block text-2xs text-text-muted">
                            {doc.docType.toUpperCase()}
                            {doc.state === "ready"
                              ? " · Sẵn sàng hỏi đáp"
                              : doc.state === "queued" ||
                                  doc.state === "processing"
                                ? " · Đang chuẩn bị"
                                : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
              </ul>
              {documents.data && !documents.data.items.length && (
                <p className="py-3 text-xs text-text-muted">
                  Không có tài liệu đã duyệt phù hợp. Hãy thử từ khóa khác hoặc
                  thêm tài liệu vào nhóm.
                </p>
              )}
              {documents.data && (
                <Pager
                  page={page}
                  totalPages={documents.data.totalPages}
                  onChange={setPage}
                />
              )}
              <a
                className="inline-block text-xs font-semibold text-primary"
                href={`/workspace/${encodeURIComponent(slug)}?tab=documents`}
              >
                Xem tài liệu trong nhóm →
              </a>
            </div>
          )}
          <p className="mt-4 text-2xs leading-5 text-text-faint">
            Khi dùng AI, nội dung tài liệu được chọn được gửi tới OpenAI để xử
            lý. PDF cần có văn bản; file .doc/.ppt cũ cần chuyển sang
            .docx/.pptx.
          </p>
        </Card>
        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <WandSparkles className="size-4 text-primary" />
            Tạo bài luyện tập với AI
          </h2>
          <p className="mb-3 mt-1 text-xs leading-relaxed text-text-muted">
            Ôn tập từ tài liệu đã chọn. Câu hỏi được tạo trong hội thoại, không
            tự giao bài vào nhóm.
          </p>
          <div className="space-y-2">
            {exercises.map((item) => (
              <button
                key={item.title}
                disabled={disabled}
                onClick={() => suggest(item.prompt)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-bg disabled:opacity-50"
              >
                <span className="block text-xs font-semibold text-navy">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-2xs text-text-faint">
                  {item.detail}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </aside>
      <Modal
        open={Boolean(citation)}
        onClose={() => setCitation(null)}
        title={
          citation
            ? `[${citation.sourceId}] ${citation.title}`
            : "Nguồn tài liệu"
        }
        description={
          citation?.page
            ? `Trích đoạn ở trang/slide ${citation.page}`
            : "Trích đoạn được dùng làm nguồn trả lời"
        }
        width="lg"
      >
        <div className="space-y-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-text">
            {citation?.excerpt}
          </p>
          <Button
            href={`/workspace/${encodeURIComponent(slug)}?tab=documents`}
            variant="outline"
          >
            <BookOpen className="size-4" />
            Mở tài liệu trong nhóm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Phân trang"
      className="mt-3 flex items-center justify-between gap-2 text-xs text-text-muted"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </Button>
      <span>
        {page}/{totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </Button>
    </nav>
  );
}
function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-border bg-surface p-3 text-sm text-danger"
    >
      <p>{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={retry}
      >
        Thử lại
      </Button>
    </div>
  );
}
