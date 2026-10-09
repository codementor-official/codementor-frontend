"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  FileText,
  History,
  Lightbulb,
  ListChecks,
  Search,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { ConfirmButton, FieldError, fieldA11y, Select, useToast } from "@codementor/ui";
import { search as searchRule } from "@codementor/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type { AiDocument, AiPage } from "./types";
import { TutorChat } from "./tutor-chat";
import { MAX_DOCUMENTS, TutorProvider, useTutor } from "./tutor-store";
import { aiError, useAiResource } from "./use-ai-resource";

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
  // `ListWorkspacesQueryDto.q` ≤ 200. Quá trần thì báo lỗi và vẫn tìm theo 200 ký tự đầu —
  // ponytail: cắt thay vì giữ kết quả cũ; đổi sang "giữ truy vấn hợp lệ gần nhất" nếu cần.
  const qError = searchRule(q, 200);
  const query = q.trim().slice(0, 200);
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<{ slug: string; name: string } | null>(
    null,
  );
  const [locked, setLocked] = useState(false);
  const groups = useAiResource(
    `groups:${page}:${query}`,
    useCallback(
      () => api.workspaces.list({ scope: "mine", page, limit: 20, q: query }),
      [page, query],
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
          {...fieldA11y("tutor-group-search", qError)}
          aria-label="Tìm nhóm của bạn"
          className={`${field} mt-2`}
          placeholder="Tên nhóm học tập..."
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <FieldError className="mt-1 text-xs" error={qError} htmlFor="tutor-group-search" />
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

function WorkspaceTutor(props: {
  slug: string;
  name: string;
  picker: ReactNode;
  setLocked: (locked: boolean) => void;
}) {
  return (
    <TutorProvider slug={props.slug}>
      <TutorWorkspace {...props} />
    </TutorProvider>
  );
}

function TutorWorkspace({
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
  const tutor = useTutor();
  const [q, setQ] = useState("");
  // `AiPageQuery.q` ≤ 200 — cùng cách xử lý với ô tìm nhóm ở trên.
  const qError = searchRule(q, 200);
  const query = q.trim().slice(0, 200);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);
  const status = useAiResource(
    `status:${slug}`,
    useCallback(
      () => (slug ? api.ai.status(slug) : Promise.resolve(null)),
      [slug],
    ),
  );
  const documents = useAiResource(
    `documents:${slug}:${page}:${query}`,
    useCallback(
      () =>
        slug
          ? api.ai.documents(slug, { page, limit: 6, q: query })
          : Promise.resolve(emptyPage<AiDocument>()),
      [slug, page, query],
    ),
  );
  const ready = Boolean(status.data?.configured);
  const busy = tutor.running || tutor.opening;
  const selectedCount = tutor.selected.length;
  const isSelected = (id: string) => tutor.selected.some((doc) => doc.id === id);

  useEffect(() => {
    setLocked(busy);
    return () => setLocked(false);
  }, [busy, setLocked]);

  // Lượt vừa xong thì tài liệu vừa được chuẩn bị: làm mới nhãn "Sẵn sàng hỏi đáp".
  const refreshDocuments = documents.refresh;
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !tutor.running) refreshDocuments();
    wasRunning.current = tutor.running;
  }, [tutor.running, refreshDocuments]);

  function suggest(prompt: string) {
    setInput(prompt);
    composer.current?.focus();
  }
  async function remove(id: string) {
    try {
      await tutor.removeSession(id);
      toast.success("Đã xóa hội thoại.");
    } catch (cause) {
      toast.error(aiError(cause));
    }
  }

  const notice = (
    <>
      {status.error && <LoadError message={status.error} retry={status.refresh} />}
      {status.data && !ready && (
        <p role="status" className="text-xs text-text-muted">
          Trợ lý chưa sẵn sàng. Vui lòng liên hệ quản trị viên hoặc{" "}
          <button onClick={status.refresh} className="font-semibold text-primary">
            kiểm tra lại
          </button>
          .
        </p>
      )}
    </>
  );

  return (
    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.72fr)]">
      <TutorChat
        slug={slug}
        ready={ready}
        input={input}
        setInput={setInput}
        composerRef={composer}
        notice={notice}
      />

      <div className="order-2 flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-10.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <aside className="order-2 min-w-0 space-y-4">
        <Card className="p-4">
          <h2 className="mb-1 text-sm font-bold text-navy">Học tiếp với AI</h2>
          <p className="mb-3 text-xs leading-relaxed text-text-muted">
            Chọn cách học. Trợ lý sẽ dựa vào tài liệu bạn chọn.
          </p>
          <div className="space-y-2">
            {learningTools.map((tool) => (
              <button
                key={tool.title}
                disabled={busy}
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
          {tutor.loadingSessions && !tutor.sessions.length && (
            <p className="py-3 text-xs text-text-muted">Đang tải lịch sử...</p>
          )}
          <ul className="min-h-40 max-h-[440px] divide-y divide-border-soft overflow-y-auto overscroll-contain">
            {tutor.sessions.map((chat) => (
              <li
                key={chat.id}
                className={`flex items-center gap-1 rounded-md py-1 ${tutor.threadId === chat.id ? "bg-primary-tint" : ""}`}
              >
                <button
                  disabled={busy}
                  onClick={() => tutor.openSession(chat.id)}
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
                  disabled={busy}
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
          {!tutor.loadingSessions && !tutor.sessions.length && (
            <p className="py-3 text-xs text-text-muted">
              {slug
                ? "Chưa có hội thoại. Câu trả lời sẽ được lưu tại đây."
                : "Chọn nhóm học tập để xem lịch sử."}
            </p>
          )}
        </Card>
      </aside>

      <aside className="order-1 min-w-0 space-y-4">
        <Card className="p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <FileText className="size-4 text-primary" />
            Tài liệu học cùng AI
          </h2>
          <p className="mb-4 mt-1 text-xs leading-relaxed text-text-muted">
            Chọn nguồn đã được duyệt trong nhóm. Tài liệu được tự động chuẩn bị
            khi bạn gửi câu hỏi, và đổi được giữa hội thoại.
          </p>
          {picker}
          {!!slug && (
            <div className="mt-4 space-y-3 border-t border-border-soft pt-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-faint" />
                <input
                  {...fieldA11y("tutor-document-search", qError)}
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
              <FieldError className="text-xs" error={qError} htmlFor="tutor-document-search" />
              <p className="text-xs text-text-muted">
                Đã chọn {selectedCount}/{MAX_DOCUMENTS} · PDF, DOCX, PPTX, TXT, MD
              </p>
              {!!selectedCount && (
                <div className="flex flex-wrap gap-1.5">
                  {tutor.selected.map((doc) => (
                    <span
                      key={doc.id}
                      className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary-tint px-2 py-1 text-xs text-primary"
                    >
                      <span className="truncate" title={doc.title}>
                        {doc.title}
                      </span>
                      <button
                        aria-label={`Bỏ chọn ${doc.title}`}
                        disabled={busy}
                        onClick={() => tutor.toggleDocument(doc, false)}
                      >
                        <X className="size-3" />
                      </button>
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
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-bg ${isSelected(doc.id) ? "border-primary/40 bg-primary-tint" : "border-border-soft"}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 shrink-0 accent-primary"
                          checked={isSelected(doc.id)}
                          disabled={
                            busy ||
                            (!isSelected(doc.id) && selectedCount >= MAX_DOCUMENTS)
                          }
                          onChange={(event) =>
                            tutor.toggleDocument(
                              { id: doc.id, title: doc.title },
                              event.target.checked,
                            )
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
                                : doc.state === "failed"
                                  ? " · Không đọc được"
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
                disabled={busy}
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
      </div>
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
