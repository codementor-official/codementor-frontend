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
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import type { Message } from "@ag-ui/client";
import { api } from "@/lib/api";
import type { CodeyItem, CodeyRun, CodeySessionSummary, MascotState } from "./types";

/**
 * Trạng thái của Codey trên trang giải bài — một nguồn cho cả sidebar lẫn bong bóng mascot.
 *
 * Phải là context chứ không phải prop: bong bóng nằm trong `WorkspaceBody` còn khung chat nằm
 * trong `renderTabContent`, hai nhánh khác nhau của cây, và `WorkspaceBody` đã nhận nhiều prop.
 *
 * Đây cũng là chỗ DUY NHẤT biết tới CopilotKit. Các component chỉ thấy `items`, `send`,
 * `sessions` — nên đổi thư viện chat sau này là sửa một tệp.
 */

const MASCOT_VISIBLE_KEY = "codey:mascot-visible";

/** Trùng với `Capability.agent_id` ở ai-service và với `SURFACES.codey.agentId` ở tầng Node. */
const RUNTIME_AGENT_ID = "codey";

interface CodeyValue {
  /** Hội thoại đang mở, đã chuẩn hoá cho UI. */
  items: CodeyItem[];
  sending: boolean;
  send: (text: string) => void;

  threadId: string;
  sessions: CodeySessionSummary[];
  loadingSessions: boolean;
  /** Nạp danh sách. Gọi khi droplist MỞ, không phải lúc trang dựng: phần lớn lượt vào trang
   *  giải bài không ai mở lịch sử, và một request cho mỗi lượt vào là request thừa. */
  loadSessions: () => void;
  newSession: () => void;
  openSession: (id: string) => void;
  removeSession: (id: string) => void;

  mascotVisible: boolean;
  toggleMascot: () => void;
  hideMascot: () => void;

  /** Trạng thái sprite đã tính sẵn: "thinking" thắng khi Codey đang trả lời. */
  mascotState: MascotState;
  /** Lời mời sau một lần chạy hỏng. `null` khi không có gì để mời. */
  invite: string | null;
  dismissInvite: () => void;
  /** Gửi sẵn câu hỏi về lần chạy vừa rồi. Dùng cho cú bấm vào bong bóng. */
  askAboutRun: () => void;
  hasFailingRun: boolean;
}

const CodeyContext = createContext<CodeyValue | null>(null);

export function useCodey(): CodeyValue {
  const value = useContext(CodeyContext);
  if (!value) throw new Error("useCodey phải nằm trong <CodeyProvider>");
  return value;
}

/**
 * Mảng `Message` của AG-UI → thứ khung chat vẽ được.
 *
 * Một lượt trả lời gồm nhiều message: lời gọi tool nằm trên message `assistant` (content rỗng),
 * kết quả nằm ở message `tool` riêng. Vẽ thô cả mảng thì học viên thấy vài bong bóng trống.
 * Ở đây lời gọi tool thành MỘT dòng trạng thái, và message `tool` chỉ dùng để đánh dấu đã xong.
 */
/** `content` của AG-UI có thể là chuỗi hoặc mảng phần tử (text, ảnh, âm thanh…). Codey chỉ
 *  sinh và nhận chữ, nhưng kiểu thì rộng hơn thế — lấy phần text ra thay vì ép kiểu. */
function textOf(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function toItems(messages: readonly Message[]): CodeyItem[] {
  const answered = new Set(
    messages.flatMap((message) =>
      message.role === "tool" && message.toolCallId ? [message.toolCallId] : [],
    ),
  );
  const items: CodeyItem[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      const text = textOf(message.content);
      if (text) items.push({ kind: "user", id: message.id, text });
      continue;
    }
    if (message.role !== "assistant") continue;
    for (const call of message.toolCalls ?? []) {
      items.push({
        kind: "tool",
        id: call.id,
        name: call.function.name,
        done: answered.has(call.id),
      });
    }
    // Nội dung rỗng là bình thường khi lượt đó chỉ gọi tool — đừng đẩy ra một bong bóng trắng.
    const text = textOf(message.content);
    if (text.trim()) items.push({ kind: "codey", id: message.id, text });
  }
  return items;
}

export function CodeyProvider({
  editorState,
  lastRun,
  codeRevision,
  children,
}: {
  /** Trạng thái đến từ trang: gõ code, đang chấm, vừa đạt, vừa hỏng. */
  editorState: MascotState;
  lastRun: CodeyRun | null;
  /** Tăng mỗi lần học viên sửa code. Sửa code = đã tự tìm ra chỗ sai, lời mời thành nhiễu. */
  codeRevision: number;
  children: ReactNode;
}) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<CodeySessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  /** `seq` của lần chạy mà học viên đã bỏ qua lời mời. `0` = chưa bỏ qua lần nào. */
  const [dismissedSeq, setDismissedSeq] = useState(0);
  /** Thread vừa được chọn từ droplist và đang chờ nạp lại tin nhắn. */
  const [restoreId, setRestoreId] = useState<string | null>(null);
  /** Thread đã nạp rồi — chặn effect nạp lại và ghi đè lượt học viên vừa gõ. */
  const restored = useRef<string | null>(null);

  /**
   * `agentId` cục bộ RIÊNG cho từng thread, `runtimeAgentId` mới là agent thật.
   *
   * `useAgent` từ chối cặp `{agentId, threadId}` mà không có `runtimeAgentId`: agent runtime là
   * singleton, nên ghi thẳng threadId lên nó sẽ để hai hook cùng `agentId` giẫm lên nhau. Đăng
   * ký một agent proxy riêng cho mỗi thread là cách thư viện cho phép ghim thread.
   */
  const { agent, isReady } = useAgent({
    agentId: `${RUNTIME_AGENT_ID}:${threadId}`,
    runtimeAgentId: RUNTIME_AGENT_ID,
    threadId,
  });
  const { copilotkit } = useCopilotKit();

  /** Agent hiện hành. `useAgent` trả về một instance khác cho mỗi thread, nên một `.then()`
   *  bắt đầu từ trước lúc đổi thread phải ghi vào instance MỚI, không phải cái nó bắt được. */
  const agentRef = useRef(agent);
  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  const items = useMemo(() => toItems(agent.messages), [agent.messages]);
  const sending = agent.isRunning;

  useEffect(() => {
    try {
      setMascotVisible(window.localStorage.getItem(MASCOT_VISIBLE_KEY) === "1");
    } catch {
      // Trình duyệt chặn site data: mascot mặc định tắt, không có gì hỏng.
    }
  }, []);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    api.codey
      .sessions()
      .then((page) => setSessions(page.items))
      .catch(() => undefined)
      .finally(() => setLoadingSessions(false));
  }, []);

  // Nạp lại khi một lượt vừa xong: server ghi hội thoại SAU khi stream đóng, nên đó là lúc
  // tiêu đề mới xuất hiện.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !sending) loadSessions();
    wasRunning.current = sending;
  }, [sending, loadSessions]);

  /**
   * Chạy qua CORE, không phải `agent.runAgent()` thẳng.
   *
   * `agent.runAgent()` gửi đi một lượt với `tools: []` và `context: []` — Codey nhận được câu
   * hỏi nhưng KHÔNG có `read_editor_code`, `read_last_run` hay đề bài, nên nó quay ra bảo học
   * viên tự dán code vào. `copilotkit.runAgent({ agent })` mới là hàm gom tool đã đăng ký
   * (`buildFrontendTools`) cùng ngữ cảnh (`getContextForAgent`), và gắn cả subscriber THI HÀNH
   * tool rồi chạy tiếp lượt sau khi có kết quả. Đó là đường mà `<CopilotChat>` đi.
   */
  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || agent.isRunning) return;
      agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
      void copilotkit.runAgent({ agent });
    },
    [agent, copilotkit],
  );

  const newSession = useCallback(() => setThreadId(crypto.randomUUID()), []);

  /**
   * Mở một hội thoại cũ: đổi thread, việc nạp để effect bên dưới làm.
   *
   * KHÔNG gọi `setMessages` ngay tại đây: `useAgent` trả về một agent khác cho mỗi `threadId`,
   * còn closure này thì đang giữ agent của thread CŨ. Ghi vào nó thì fetch vẫn 200, dữ liệu vẫn
   * về, mà màn hình không đổi gì — một lỗi không có thông báo nào.
   */
  const openSession = useCallback((id: string) => {
    setThreadId(id);
    setRestoreId(id);
  }, []);

  /**
   * Nạp tin nhắn của hội thoại vừa chọn, sau khi agent của thread đó đã sẵn sàng.
   *
   * Không dựa vào `connect` của CopilotKit như Lecter: đường đó chỉ chạy khi `<CopilotChat>`
   * mount, mà khung chat ở đây là của repo.
   *
   * `isReady` là bắt buộc: trong lúc runtime còn bắt tay, `agent` là một bản tạm sẽ bị THAY
   * bằng bản thật — ghi vào bản tạm là ghi vào thứ sắp bị vứt đi.
   */
  useEffect(() => {
    if (!isReady || !restoreId || restoreId !== threadId || restored.current === threadId) return;
    restored.current = threadId;
    const wanted = threadId;
    // KHÔNG huỷ ở cleanup. Effect này chạy lại ngay sau khi đổi thread — `agent` đổi identity —
    // nên một cờ `cancelled` sẽ giết đúng request vừa mở, còn lần chạy thứ hai thì bị `restored`
    // chặn lại. Kết quả: fetch trả về 200, `.then()` bỏ qua, màn hình đứng im, không lỗi nào.
    // Thay bằng kiểm ĐIỀU KIỆN THẬT lúc dữ liệu về: người dùng còn đang ở thread này không.
    api.codey
      .session(wanted)
      .then((found) => {
        if (restored.current === wanted) agentRef.current.setMessages(found.messages ?? []);
      })
      .catch(() => undefined);
  }, [isReady, restoreId, threadId]);

  const removeSession = useCallback(
    (id: string) => {
      setSessions((current) => current.filter((session) => session.id !== id));
      void api.codey.removeSession(id).catch(loadSessions);
      // Xoá đúng phiên đang mở thì mở một phiên trống, không để màn hình treo ở nội dung đã xoá.
      if (id === threadId) setThreadId(crypto.randomUUID());
    },
    [loadSessions, threadId],
  );

  const storeVisible = (next: boolean) => {
    try {
      window.localStorage.setItem(MASCOT_VISIBLE_KEY, next ? "1" : "0");
    } catch {
      // Không lưu được thì mascot chỉ sống trong tab này. Không đáng để chặn thao tác.
    }
  };

  const toggleMascot = useCallback(() => {
    setMascotVisible((visible) => {
      storeVisible(!visible);
      return !visible;
    });
  }, []);

  const hideMascot = useCallback(() => {
    storeVisible(false);
    setMascotVisible(false);
  }, []);

  const failed = lastRun?.failed ?? 0;
  const hasFailingRun = failed > 0;

  /**
   * Lời mời của mascot — DẪN XUẤT, không phải state đồng bộ bằng effect.
   *
   * Ba điều kiện, cả ba đọc thẳng từ số: có test hỏng, chưa bỏ qua đúng lần chạy này, và code
   * chưa bị sửa kể từ lần chạy đó. Viết bằng hai `useEffect` + `setInviteDismissed` thì thứ tự
   * hai effect quyết định kết quả — chạy xong rồi gõ một phím sẽ ra lời mời hay không tuỳ effect
   * nào chạy sau. Ở đây không có thứ tự nào để mà sai.
   *
   * Câu mời KHÔNG nhắc con số: lỗi biên dịch cho `totalTests === 0`, nên "0 test chưa đạt" thì
   * vô nghĩa còn "1 test chưa đạt" thì sai. Con số nằm trong câu hỏi gửi đi, chỗ nó đúng.
   */
  const invite =
    lastRun &&
    hasFailingRun &&
    lastRun.seq !== dismissedSeq &&
    codeRevision === lastRun.codeRevision
      ? "Có chỗ chưa ổn — mình xem giúp nhé?"
      : null;

  const dismissInvite = useCallback(() => setDismissedSeq(lastRun?.seq ?? 0), [lastRun?.seq]);

  const askAboutRun = useCallback(() => {
    dismissInvite();
    send(
      failed > 0
        ? `Mình vừa chạy và có ${failed} test chưa đạt, xem giúp mình với.`
        : "Mình đang bí, gợi ý cho mình bước tiếp theo với.",
    );
  }, [dismissInvite, failed, send]);

  const value = useMemo<CodeyValue>(
    () => ({
      items,
      sending,
      send,
      threadId,
      sessions,
      loadingSessions,
      loadSessions,
      newSession,
      openSession,
      removeSession,
      mascotVisible,
      toggleMascot,
      hideMascot,
      // Codey đang trả lời thì mọi trạng thái khác nhường chỗ — đó là thứ người dùng đang chờ.
      mascotState: sending ? "thinking" : editorState,
      invite,
      dismissInvite,
      askAboutRun,
      hasFailingRun,
    }),
    [
      askAboutRun,
      dismissInvite,
      editorState,
      hasFailingRun,
      hideMascot,
      invite,
      items,
      loadSessions,
      loadingSessions,
      mascotVisible,
      newSession,
      openSession,
      removeSession,
      send,
      sending,
      sessions,
      threadId,
      toggleMascot,
    ],
  );

  return <CodeyContext.Provider value={value}>{children}</CodeyContext.Provider>;
}