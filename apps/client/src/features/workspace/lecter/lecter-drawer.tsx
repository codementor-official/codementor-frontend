"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { History, Plus, Sparkles, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { SideDrawer, useToast } from "@codementor/ui";
import type { ExerciseDraft } from "@codementor/solve";
import {
  CopilotChat,
  CopilotKitProvider,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { Button } from "@/components/ui/button";
import { api, currentAccessToken } from "@/lib/api";
import { messageOf } from "../exercise-authoring";
import { LecterApplyTool } from "./apply-tool";
import { LecterComposer } from "./composer";
import { LecterProvider } from "./context";
import { LecterReadDraftTool } from "./read-draft-tool";
import { LecterToolRenderers } from "./tool-renderers";
import type { LecterDraftPatch, LecterSessionSummary } from "./types";

/** Cùng tên với `Capability.agent_id` ở ai-service và với `AGENT_ID` của route runtime. */
const AGENT_ID = "lecter_workspace";

/** Trễ tối đa giữa lúc token được gia hạn và lúc CopilotKit biết. */
const TOKEN_SYNC_MS = 30_000;

/**
 * `null` với phiên đăng nhập bằng mật khẩu — token của họ nằm trong cookie HttpOnly và tầng Node
 * `/api/copilotkit` gắn hộ. Gửi `"Bearer "` rỗng thì tầng đó tưởng trình duyệt đã có token và
 * chuyển tiếp một header hỏng, nên ở đây phải là "không gửi gì cả".
 */
function bearer(): string | null {
  const token = currentAccessToken();
  return token ? `Bearer ${token}` : null;
}

/**
 * Giữ cho header `Authorization` của CopilotKit luôn là token hiện hành.
 *
 * `AuthProvider` giữ token trong `useRef` và cố tình không re-render khi token được gia hạn
 * (~5 phút một lần), còn CopilotKit thì trải phẳng prop `headers` MỘT LẦN rồi giữ bản sao — nên
 * getter hay hàm đặt trong prop đó đều vô dụng, và không có cầu nối này thì sau ~5 phút mọi lượt
 * trả 401.
 *
 * So sánh với `copilotkit.headers` chứ không với một ref cục bộ: `CopilotKitProvider` cũng gọi
 * `setHeaders(mergedHeaders)` trong effect CỦA CHÍNH NÓ, mà effect của cha chạy SAU effect của
 * con — mọi giá trị đặt ở đây lúc mount đều bị nó ghi đè. Đọc lại trạng thái thật của core khiến
 * vòng này tự chữa.
 */
function AuthHeaderSync() {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    const apply = () => {
      const value = bearer();
      if (!value || copilotkit.headers?.Authorization === value) return;
      copilotkit.setHeaders({ Authorization: value });
    };
    apply();
    const timer = setInterval(apply, TOKEN_SYNC_MS);
    return () => clearInterval(timer);
  }, [copilotkit]);

  return null;
}

/** Markdown của repo, không phải của CopilotKit: cùng `.rich-text` mà AI Tutor và studio dùng. */
function Markdown({ content }: { content: string }) {
  return (
    <div className="rich-text break-words text-sm leading-7 [&_pre]:overflow-x-auto">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
    </div>
  );
}

function Welcome() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 pb-28 text-center">
      <div className="max-w-sm">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles aria-hidden="true" className="size-6" />
        </span>
        <p className="text-sm font-semibold text-navy">Bắt đầu từ tài liệu của nhóm</p>
        <p className="mt-2 text-xs leading-6 text-text-muted">
          Đính kèm tài liệu đã duyệt bằng nút +, rồi mô tả bài tập bạn muốn: chủ đề, mức độ, dạng
          input/output. Lecter soạn đề bài và test case rồi đưa vào biểu mẫu để bạn rà lại.
        </p>
      </div>
    </div>
  );
}

/** Danh sách hội thoại cũ dưới dạng droplist — drawer chỉ rộng bằng một cột. */
function HistoryMenu({
  sessions,
  activeId,
  loading,
  onPick,
  onRemove,
}: {
  sessions: LecterSessionSummary[];
  activeId: string;
  loading: boolean;
  onPick: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <History aria-hidden="true" className="size-3.5" />
        Lịch sử
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          {loading && <p className="px-2 py-3 text-xs text-text-faint">Đang tải…</p>}
          {!loading && sessions.length === 0 && (
            <p className="px-2 py-3 text-xs text-text-faint">Chưa có hội thoại nào.</p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-1 rounded-md px-1 ${session.id === activeId ? "bg-primary/5" : ""}`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onPick(session.id);
                  setOpen(false);
                }}
                className="min-w-0 flex-1 px-1 py-2 text-left"
              >
                <span className="block truncate text-xs font-medium text-navy">
                  {session.title}
                </span>
                <span className="block text-2xs text-text-faint">
                  {new Date(session.updatedAt).toLocaleString("vi-VN")}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Xoá hội thoại ${session.title}`}
                onClick={() => onRemove(session.id)}
                className="shrink-0 rounded p-1 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPanel({ threadId, onRunEnd }: { threadId: string; onRunEnd: () => void }) {
  const toast = useToast();
  const { agent } = useAgent({ agentId: AGENT_ID });
  const running = agent.isRunning;
  const empty = agent.messages.length === 0;
  const wasRunning = useRef(false);

  // Lượt vừa kết thúc = server vừa ghi xong hội thoại; nạp lại lịch sử để tiêu đề mới xuất hiện.
  useEffect(() => {
    if (wasRunning.current && !running) onRunEnd();
    wasRunning.current = running;
  }, [running, onRunEnd]);

  return (
    <div className="relative min-h-0 flex-1">
      <CopilotChat
        agentId={AGENT_ID}
        /* Bỏ prop này là hội thoại bị tách: CopilotKit tự sinh một threadId ngẫu nhiên rồi GHI
           ĐÈ `agent.threadId`, nên server lưu dưới một id khác với id đang hiển thị. */
        threadId={threadId}
        labels={{
          chatInputPlaceholder: "Nhờ Lecter soạn bài từ tài liệu đã duyệt…",
          chatDisclaimerText: "Lecter không lưu bài. Bạn tự bấm Lưu ở studio.",
        }}
        messageView={{ assistantMessage: { markdownRenderer: Markdown } }}
        /* Slot, không phải prop: `inputValue`/`onInputChange`/`onSubmitMessage` truyền thẳng cho
           <CopilotChat> đều bị chính nó ghi đè. Xem `composer.tsx`. */
        input={LecterComposer}
        onError={(event) => {
          // Kiểu của prop này gộp cả `onError` của <div>, nên phải thu hẹp trước khi đọc.
          if (!("error" in event)) return;
          toast.error(event.error.message || "Lượt này hỏng. Thử lại giúp mình.");
        }}
        welcomeScreen={false}
      />
      {/* Chỉ xét số tin nhắn, KHÔNG xét `isRunning`: lúc mount, CopilotChat gọi `connect` và cờ
          đó bật lên vài trăm mili giây — đủ để màn hình rỗng nuốt mất phần giới thiệu và thay
          bằng một cái spinner không giải thích gì. Lượt thật thì tin nhắn của người soạn vào
          `messages` ngay, nên `empty` tự tắt đúng lúc. */}
      {empty && <Welcome />}
    </div>
  );
}

/**
 * Chat với Lecter ngay trong studio bài tập của nhóm.
 *
 * Lecter KHÔNG ghi vào hệ thống: nó đề nghị, người soạn bấm "Đưa vào form", rồi vẫn tự bấm
 * "Lưu bài tập" như mọi lần — xem `apply-tool.tsx`.
 */
export function LecterDrawer({
  open,
  slug,
  draft,
  editingSaved,
  onClose,
  onApply,
}: {
  open: boolean;
  slug: string;
  draft: ExerciseDraft;
  editingSaved: boolean;
  onClose: () => void;
  onApply: (patch: LecterDraftPatch) => void;
}) {
  const toast = useToast();
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<LecterSessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.lecter
      .sessions(slug)
      .then((page) => setSessions(page.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const remove = async (id: string) => {
    try {
      await api.lecter.removeSession(slug, id);
      setSessions((current) => current.filter((session) => session.id !== id));
      if (id === threadId) setThreadId(crypto.randomUUID());
      toast.success("Đã xoá hội thoại");
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  if (!open) return null;
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Lecter"
      /* Thanh công cụ bên dưới đã có tên, nút đóng và lịch sử: thêm header dựng sẵn nữa là hai
         hàng cùng nội dung, ăn mất chiều cao của khung chat. */
      showHeader={false}
    >
      <div className="-mx-4 -my-4 flex h-[calc(100%+2rem)] flex-col sm:-mx-5">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-soft px-4 py-2 sm:px-5">
          <Button variant="ghost" size="sm" onClick={() => setThreadId(crypto.randomUUID())}>
            <Plus aria-hidden="true" className="size-3.5" />
            Hội thoại mới
          </Button>
          <div className="flex items-center gap-1.5">
            <HistoryMenu
              sessions={sessions}
              activeId={threadId}
              loading={loading}
              onPick={setThreadId}
              onRemove={(id) => void remove(id)}
            />
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg hover:text-navy"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        <LecterProvider value={{ slug, draft, applyPatch: onApply, editingSaved }}>
          <CopilotKitProvider
            // Inspector bật mặc định ở dev và chèn cả banner quảng cáo của CopilotKit vào giữa
            // trang. `showDevConsole` KHÔNG còn điều khiển nó; `enableInspector` mới là cờ đúng.
            enableInspector={false}
            // Tầng Node cùng origin, không phải Kong: nó gắn token hộ phiên đăng nhập bằng mật
            // khẩu, thứ không có token nào trong trình duyệt để mà forward.
            runtimeUrl={`/api/copilotkit/w/${encodeURIComponent(slug)}`}
          >
            {/* Trước <ChatPanel>: effect của con chạy theo thứ tự khai báo, header phải có
                trước lần connect đầu tiên. */}
            <AuthHeaderSync />
            <LecterToolRenderers />
            <LecterApplyTool />
            <LecterReadDraftTool />
            <ChatPanel threadId={threadId} onRunEnd={load} />
          </CopilotKitProvider>
        </LecterProvider>
      </div>
    </SideDrawer>
  );
}
