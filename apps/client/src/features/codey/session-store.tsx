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
import type { CodeyMessage, CodeyRun, CodeySessionSummary, MascotState } from "./types";

/**
 * Trạng thái của Codey trên trang giải bài — một nguồn cho cả sidebar lẫn bong bóng mascot.
 *
 * Phải là context chứ không phải prop: bong bóng nằm trong `WorkspaceBody` còn khung chat nằm
 * trong `renderTabContent`, hai nhánh khác nhau của cây, và `WorkspaceBody` đã nhận 7 prop rồi.
 *
 * Đây cũng là ĐƯỜNG NỐI duy nhất với backend. Bước 1 của kế hoạch thay thân `send()` bằng
 * CopilotKit (`useAgent().runAgent`) và `sessions` bằng `api.codey.sessions()`; mọi component
 * dùng context này không phải sửa một dòng nào.
 */

const MASCOT_VISIBLE_KEY = "codey:mascot-visible";

// ponytail: chưa nối API. Bước 1 thay bằng lượt chạy thật; giữ câu này thay vì một câu trả lời
// giả để không ai nhầm nó với gợi ý thật của Codey.
const NOT_WIRED =
  "_(Codey chưa được nối với API — phần trả lời thật sẽ có ở bước tiếp theo. Giao diện, lịch sử phiên và bong bóng mascot thì đã chạy đúng như bản cuối.)_";

interface CodeyValue {
  /** Hội thoại đang mở. */
  messages: CodeyMessage[];
  sending: boolean;
  send: (text: string) => void;

  threadId: string;
  sessions: CodeySessionSummary[];
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

export function CodeyProvider({
  exerciseTitle,
  editorState,
  lastRun,
  codeRevision,
  children,
}: {
  exerciseTitle: string;
  /** Trạng thái đến từ trang: gõ code, đang chấm, vừa đạt, vừa hỏng. */
  editorState: MascotState;
  lastRun: CodeyRun | null;
  /** Tăng mỗi lần học viên sửa code. Sửa code = đã tự tìm ra chỗ sai, lời mời thành nhiễu. */
  codeRevision: number;
  children: ReactNode;
}) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  // Giữ theo thread để đổi qua lại giữa các phiên không mất nội dung đang đọc.
  const [threads, setThreads] = useState<Record<string, CodeyMessage[]>>({});
  const [sessions, setSessions] = useState<CodeySessionSummary[]>([]);
  const [sending, setSending] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  /** `seq` của lần chạy mà học viên đã bỏ qua lời mời. `0` = chưa bỏ qua lần nào. */
  const [dismissedSeq, setDismissedSeq] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // localStorage đọc trong effect, KHÔNG trong `useState(() => …)`: component này vẫn được
  // render phía server, và một giá trị khác nhau giữa hai lượt render là lỗi hydrate.
  useEffect(() => {
    try {
      setMascotVisible(window.localStorage.getItem(MASCOT_VISIBLE_KEY) === "1");
    } catch {
      // Trình duyệt chặn site data: mascot mặc định tắt, không có gì hỏng.
    }
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const messages = useMemo(() => threads[threadId] ?? [], [threads, threadId]);

  const append = useCallback(
    (message: CodeyMessage) => {
      setThreads((current) => ({ ...current, [threadId]: [...(current[threadId] ?? []), message] }));
    },
    [threadId],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;
      const now = new Date().toISOString();
      append({ id: crypto.randomUUID(), from: "user", text });
      setSending(true);

      // Phiên xuất hiện trong lịch sử từ câu hỏi ĐẦU TIÊN, không phải lúc mở tab: một hội thoại
      // trống không có gì để quay lại đọc.
      setSessions((current) =>
        current.some((session) => session.id === threadId)
          ? current.map((session) =>
              session.id === threadId ? { ...session, updatedAt: now } : session,
            )
          : [{ id: threadId, title: text.slice(0, 80), exerciseTitle, updatedAt: now }, ...current],
      );

      timers.current.push(
        setTimeout(() => {
          append({ id: crypto.randomUUID(), from: "codey", text: NOT_WIRED });
          setSending(false);
        }, 450),
      );
    },
    [append, exerciseTitle, sending, threadId],
  );

  const newSession = useCallback(() => setThreadId(crypto.randomUUID()), []);

  const removeSession = useCallback(
    (id: string) => {
      setSessions((current) => current.filter((session) => session.id !== id));
      setThreads((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      // Xoá đúng phiên đang mở thì mở một phiên trống, không để màn hình treo ở nội dung đã xoá.
      if (id === threadId) setThreadId(crypto.randomUUID());
    },
    [threadId],
  );

  const toggleMascot = useCallback(() => {
    setMascotVisible((visible) => {
      const next = !visible;
      try {
        window.localStorage.setItem(MASCOT_VISIBLE_KEY, next ? "1" : "0");
      } catch {
        // Không lưu được thì mascot chỉ sống trong tab này. Không đáng để chặn thao tác.
      }
      return next;
    });
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
      messages,
      sending,
      send,
      threadId,
      sessions,
      newSession,
      openSession: setThreadId,
      removeSession,
      mascotVisible,
      toggleMascot,
      hideMascot: () => {
        setMascotVisible(false);
        try {
          window.localStorage.setItem(MASCOT_VISIBLE_KEY, "0");
        } catch {
          // xem `toggleMascot`
        }
      },
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
      invite,
      mascotVisible,
      messages,
      newSession,
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
