"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CopilotKitProvider, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import type { Message } from "@ag-ui/client";
import { AgentHeaderSync, useAgentHeaders } from "@/features/agent-chat/agent-headers";
import { agentErrorMessage } from "@/features/agent-chat/run-error";
import { api } from "@/lib/api";
import type { AiCitation, TutorDocument, TutorSessionSummary, TutorState, TutorTurn } from "./types";

/**
 * Trạng thái Trợ lý AI của một nhóm học — chỗ DUY NHẤT biết tới CopilotKit, như
 * `features/codey/session-store.tsx`. Component chỉ thấy `items`, `send`, `sessions`.
 *
 * Cùng đường với Codey/Lecter: `/api/copilotkit/t/<slug>` → ai-service `/api/v1/ai/tutor`. Khác
 * Codey ở hai chỗ: lượt chạy mang `documents` trong state (tài liệu của lượt này, đổi được giữa
 * hội thoại), và câu trả lời đã xong vẽ từ `grounding` server gửi về chứ không từ chữ thô.
 */

/** Trùng với `Capability.agent_id` ở ai-service và `SURFACES.t.agentId` ở tầng Node. */
const RUNTIME_AGENT_ID = "tutor";
export const MAX_DOCUMENTS = 8;

/** Một lượt hỏi đáp trên màn hình. */
export interface TutorItem {
  /** Id tin nhắn người dùng — cũng là khoá của `grounding`. */
  id: string;
  question: string;
  /** Chữ thô của trợ lý (đang chảy, hoặc câu thông báo khi lượt dừng sớm). */
  text: string;
  /** Lượt đã đối chiếu. Có cái này thì vẽ từ nó, bỏ qua `text`. */
  turn?: TutorTurn;
  /** Lượt đang chạy. */
  live: boolean;
}

interface TutorValue {
  enabled: boolean;
  items: TutorItem[];
  running: boolean;
  /** Việc trợ lý sắp làm — dòng trạng thái thay cho spinner câm. */
  step: string;
  /** Đoạn tài liệu của lượt đang chạy, có ngay sau bước tìm, trước chữ đầu tiên. */
  sources: AiCitation[];
  error: string;
  /** Gửi câu hỏi với tài liệu đang chọn. `false` = không gửi được; câu hỏi nên được giữ lại. */
  send: (question: string) => Promise<boolean>;
  stop: () => void;

  selected: TutorDocument[];
  toggleDocument: (document: TutorDocument, on: boolean) => void;

  threadId: string;
  sessions: TutorSessionSummary[];
  loadingSessions: boolean;
  opening: boolean;
  newSession: () => void;
  openSession: (id: string) => void;
  removeSession: (id: string) => Promise<void>;
}

const TutorContext = createContext<TutorValue | null>(null);

export function useTutor(): TutorValue {
  const value = useContext(TutorContext);
  if (!value) throw new Error("useTutor phải nằm trong <TutorProvider>");
  return value;
}

function textOf(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function toItems(
  messages: readonly Message[],
  grounding: Record<string, TutorTurn>,
  running: boolean,
): TutorItem[] {
  const items: TutorItem[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      items.push({ id: message.id, question: textOf(message.content), text: "", live: false });
      continue;
    }
    const last = items.at(-1);
    if (message.role === "assistant" && last) last.text += textOf(message.content);
  }
  for (const item of items) item.turn = grounding[item.id];
  const last = items.at(-1);
  if (last && running && !last.turn) last.live = true;
  return items;
}

/**
 * Tầng runtime + store, hoặc một store trống khi chưa chọn nhóm.
 *
 * Không dựng CopilotKit khi chưa có nhóm: `runtimeUrl` cần slug, và một provider trỏ vào
 * `/api/copilotkit/t/` sẽ gọi `/info`, nhận 400 rồi báo lỗi kết nối cho một trang chưa ai dùng.
 */
export function TutorProvider({ slug, children }: { slug: string; children: ReactNode }) {
  if (!slug) return <TutorContext.Provider value={IDLE}>{children}</TutorContext.Provider>;
  return <TutorRuntime slug={slug}>{children}</TutorRuntime>;
}

const IDLE: TutorValue = {
  enabled: false,
  items: [],
  running: false,
  step: "",
  sources: [],
  error: "",
  send: async () => false,
  stop: () => undefined,
  selected: [],
  toggleDocument: () => undefined,
  threadId: "",
  sessions: [],
  loadingSessions: false,
  opening: false,
  newSession: () => undefined,
  openSession: () => undefined,
  removeSession: async () => undefined,
};

function TutorRuntime({ slug, children }: { slug: string; children: ReactNode }) {
  const headers = useAgentHeaders();
  return (
    <CopilotKitProvider
      headers={headers}
      // Inspector bật mặc định ở dev và chèn cả banner quảng cáo của CopilotKit vào giữa trang.
      enableInspector={false}
      // Tầng Node cùng origin, không phải Kong: nó gắn token hộ phiên đăng nhập bằng mật khẩu.
      runtimeUrl={`/api/copilotkit/t/${encodeURIComponent(slug)}`}
    >
      <AgentHeaderSync />
      <TutorStore slug={slug}>{children}</TutorStore>
    </CopilotKitProvider>
  );
}

function TutorStore({ slug, children }: { slug: string; children: ReactNode }) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<TutorSessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selected, setSelected] = useState<TutorDocument[]>([]);
  const [grounding, setGrounding] = useState<Record<string, TutorTurn>>({});
  const [error, setError] = useState("");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const restored = useRef<string | null>(null);
  /** Lỗi của lượt đang gửi; `copilotkit.runAgent` không ném, nó báo qua subscriber. */
  const runError = useRef<string | null>(null);

  // `agentId` cục bộ riêng cho từng thread, `runtimeAgentId` mới là agent thật — xem
  // `CodeyProvider`: đó là cách thư viện cho phép ghim thread.
  const { agent, isReady } = useAgent({
    agentId: `${RUNTIME_AGENT_ID}:${threadId}`,
    runtimeAgentId: RUNTIME_AGENT_ID,
    threadId,
  });
  const { copilotkit } = useCopilotKit();
  const agentRef = useRef(agent);
  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  const state = (agent.state ?? {}) as TutorState;
  const running = agent.isRunning;

  // `grounding` của server chỉ có trong state cho tới lượt sau — trình duyệt gửi đi state gọn
  // (`documents`), nên phải gom lại ở đây, không thì các lượt cũ mất khối trích dẫn.
  useEffect(() => {
    const subscription = agent.subscribe({
      onStateChanged: ({ state: next }) => {
        const incoming = (next as TutorState).grounding;
        if (incoming) setGrounding((current) => ({ ...current, ...incoming }));
      },
    });
    return () => subscription.unsubscribe();
  }, [agent]);

  const items = useMemo(
    () => toItems(agent.messages, grounding, running),
    [agent.messages, grounding, running],
  );

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: ({ error: cause, context }) => {
        if (context?.agentId && context.agentId !== agentRef.current.agentId) return;
        runError.current = agentErrorMessage(cause);
      },
    });
    return () => subscription.unsubscribe();
  }, [copilotkit]);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    api.tutor
      .sessions(slug)
      .then((page) => setSessions(page.items))
      .catch(() => undefined)
      .finally(() => setLoadingSessions(false));
  }, [slug]);

  useEffect(loadSessions, [loadSessions]);

  // Server ghi hội thoại SAU khi stream đóng, nên lúc lượt vừa xong là lúc tiêu đề mới xuất hiện.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running) loadSessions();
    wasRunning.current = running;
  }, [running, loadSessions]);

  const send = useCallback(
    async (question: string) => {
      if (agent.isRunning || !question || !selected.length) return false;
      setError("");
      runError.current = null;
      // State gửi đi CHỈ có tài liệu của lượt này. Server dựng lại phần còn lại (grounding từ
      // Mongo) và không tin bản của trình duyệt — gửi kèm chỉ làm nặng thân yêu cầu.
      agent.setState({ documents: selected });
      const id = crypto.randomUUID();
      agent.addMessage({ id, role: "user", content: question });
      // Qua CORE, không phải `agent.runAgent()`: xem `CodeyProvider.send`.
      await copilotkit.runAgent({ agent });
      const failure = runError.current;
      if (!failure) return true;
      setError(failure);
      // Hỏng TRƯỚC khi có chữ nào (cổng quyền, hạn mức, tài liệu hỏng): bỏ câu hỏi khỏi khung
      // chat để người dùng gửi lại từ ô soạn. Hỏng giữa chừng thì giữ — phần đã trả lời vẫn
      // có giá trị và server đã lưu nó.
      const index = agent.messages.findIndex((message) => message.id === id);
      if (index !== -1 && !agent.messages.slice(index + 1).some((m) => m.role === "assistant")) {
        agent.setMessages(agent.messages.filter((message) => message.id !== id));
      }
      return false;
    },
    [agent, copilotkit, selected],
  );

  const stop = useCallback(() => copilotkit.stopAgent({ agent }), [agent, copilotkit]);

  const toggleDocument = useCallback((document: TutorDocument, on: boolean) => {
    setSelected((current) => {
      const rest = current.filter((item) => item.id !== document.id);
      return on && rest.length < MAX_DOCUMENTS ? [...rest, document] : rest;
    });
  }, []);

  const newSession = useCallback(() => {
    setThreadId(crypto.randomUUID());
    setGrounding({});
    setError("");
  }, []);

  const openSession = useCallback((id: string) => {
    setGrounding({});
    setError("");
    setThreadId(id);
    setRestoreId(id);
  }, []);

  /**
   * Nạp hội thoại vừa chọn khi agent của thread đó đã sẵn sàng. Cùng ba cái bẫy với
   * `CodeyProvider`: ghi vào agent của thread MỚI, đợi `isReady`, và không huỷ ở cleanup.
   */
  useEffect(() => {
    if (!isReady || !restoreId || restoreId !== threadId || restored.current === threadId) return;
    restored.current = threadId;
    const wanted = threadId;
    api.tutor
      .session(slug, wanted)
      .then((found) => {
        if (restored.current !== wanted) return;
        agentRef.current.setMessages(found.messages ?? []);
        setGrounding(found.grounding ?? {});
        if (found.documents?.length) setSelected(found.documents.slice(0, MAX_DOCUMENTS));
      })
      .catch(() => setError("Không mở được hội thoại này. Vui lòng thử lại."))
      .finally(() => {
        if (restored.current === wanted) setRestoreId(null);
      });
  }, [isReady, restoreId, slug, threadId]);

  const removeSession = useCallback(
    async (id: string) => {
      await api.tutor.removeSession(slug, id);
      setSessions((current) => current.filter((session) => session.id !== id));
      if (id === threadId) newSession();
    },
    [newSession, slug, threadId],
  );

  const value = useMemo<TutorValue>(
    () => ({
      enabled: true,
      items,
      running,
      step: running ? state.step || "Đang chuẩn bị tài liệu" : "",
      sources: running ? (state.sources ?? []) : [],
      error,
      send,
      stop,
      selected,
      toggleDocument,
      threadId,
      sessions,
      loadingSessions,
      opening: Boolean(restoreId),
      newSession,
      openSession,
      removeSession,
    }),
    [
      error,
      items,
      loadingSessions,
      newSession,
      openSession,
      removeSession,
      restoreId,
      running,
      selected,
      send,
      sessions,
      state.sources,
      state.step,
      stop,
      threadId,
      toggleDocument,
    ],
  );

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
}
