"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Code2, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { useToast } from "@codementor/ui";
import {
  CopilotChat,
  CopilotKitProvider,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { readAccessToken } from "@/lib/api";
import { HistoryRail } from "./history-rail";
import { LecterHumanInTheLoop } from "./hitl";
import { ToolRenderers } from "./tool-renderers";

/** Cùng tên với `LangGraphAgent(name="lecter")` ở ai-service và khoá agent trong route runtime. */
const LECTER_AGENT_ID = "lecter";

/** Trễ tối đa giữa lúc token được gia hạn và lúc CopilotKit biết. */
const TOKEN_SYNC_MS = 30_000;

/**
 * Bơm access token hiện hành vào CopilotKit.
 *
 * Cần một thành phần riêng vì hai bên đều chốt giá trị: `AuthProvider` giữ token trong `useRef`
 * và CỐ TÌNH không re-render khi `automaticSilentRenew` đổi token (~5 phút một lần, token
 * Keycloak sống 300s), còn CopilotKit trải phẳng prop `headers` một lần bằng `Object.entries`
 * rồi giữ bản sao đó. Không có cầu nối này thì sau ~5 phút mọi lượt trả
 * `401 Token không hợp lệ` — trông hệt như "agent tự nhiên hỏng".
 *
 * `setHeaders` chỉ gọi khi token thật sự đổi: nó thông báo cho subscriber, gọi mỗi lần đọc là
 * churn vô ích.
 *
 * ponytail: hỏi thăm theo chu kỳ thay vì nghe sự kiện `userLoaded` của oidc-client-ts — ngắn
 * hơn, không phụ thuộc vào việc gia hạn đi qua đúng đường sự kiện nào. Đổi sang nghe sự kiện
 * nếu có lúc cần token mới trong vòng dưới 30 giây.
 */
function AuthHeaderSync() {
  const { copilotkit } = useCopilotKit();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    const apply = () => {
      const token = readAccessToken() ?? "";
      if (token === applied.current) return;
      applied.current = token;
      copilotkit.setHeaders({ Authorization: `Bearer ${token}` });
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

function WelcomeContent() {
  return (
    <div className="w-full max-w-xl">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles aria-hidden="true" className="size-7" />
        </div>
        <p className="mb-2 text-sm font-medium text-primary">Trợ lý soạn bài của bạn</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Bắt đầu với một ý tưởng bài code
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Mô tả chủ đề, đối tượng học viên hoặc yêu cầu bài tập. Lecter sẽ giúp bạn tạo đề bài,
          testcases và lời giải mẫu để bạn xem xét trước khi lưu.
        </p>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            [BookOpen, "Soạn bài mới", "Tạo bài tập theo chủ đề và mức độ."],
            [Code2, "Tạo testcase", "Kiểm tra đề bài với input và output rõ ràng."],
            [FileText, "Cải thiện bài có sẵn", "Tìm bài tương tự rồi chỉnh sửa nhanh hơn."],
          ].map(([Icon, title, description]) => (
            <div className="rounded-xl border border-border bg-card p-3" key={title as string}>
              <Icon aria-hidden="true" className="mb-3 size-4 text-primary" />
              <p className="text-sm font-medium text-foreground">{title as string}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description as string}</p>
            </div>
          ))}
        </div>
    </div>
  );
}

function EmptyStateOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex w-full items-center justify-center px-5 pb-28 text-center">
      <WelcomeContent />
    </div>
  );
}

function ChatPanel({ threadId, onRunEnd }: { threadId: string; onRunEnd: () => void }) {
  const toast = useToast();
  const { agent } = useAgent({ agentId: LECTER_AGENT_ID });
  const running = agent.isRunning;
  const empty = agent.messages.length === 0;
  const wasRunning = useRef(false);

  // Lượt vừa kết thúc = server vừa ghi xong hội thoại; nạp lại rail để tiêu đề mới xuất hiện.
  useEffect(() => {
    if (wasRunning.current && !running) onRunEnd();
    wasRunning.current = running;
  }, [running, onRunEnd]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="relative min-h-0 w-full flex-1">
        <CopilotChat
          agentId={LECTER_AGENT_ID}
          /* Bỏ prop này là hội thoại bị tách: CopilotKit tự sinh một threadId ngẫu nhiên
             (`providedThreadId ?? randomUUID()`) rồi GHI ĐÈ `agent.threadId`, nên server lưu
             dưới một id khác với id mà rail đang hiển thị — mỗi lần mount là một phiên mới. */
          threadId={threadId}
          labels={{
            chatInputPlaceholder: "Nhờ Lecter soạn bài code…",
            chatDisclaimerText: "Lecter có thể sai. Mọi thay đổi đều cần bạn xác nhận.",
          }}
          messageView={{ assistantMessage: { markdownRenderer: Markdown } }}
          /* Không có prop này thì lỗi của một lượt chỉ đi vào console: người soạn thấy chat im
             lặng và không biết là phải gõ lại. */
          onError={(event) => {
            // Kiểu của prop này gộp cả `onError` của <div>, nên phải thu hẹp trước khi đọc.
            if (!("error" in event)) return;
            toast.error(event.error.message || "Lượt này hỏng. Thử lại giúp mình.");
          }}
          welcomeScreen={false}
        />
        {empty && <EmptyStateOverlay />}
      </div>
    </div>
  );
}

export function LecterPage() {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [reloadKey, setReloadKey] = useState(0);
  const [railCollapsed, setRailCollapsed] = useState(false);

  // Đổi `threadId` là đủ để mở hội thoại khác: CopilotKit gọi lại `/agent/lecter/connect`, và
  // route runtime phát lại lịch sử từ `ai_agent_sessions`. Trang không cầm mảng tin nhắn nữa.
  const openThread = useCallback((id: string) => setThreadId(id), []);
  const newThread = useCallback(() => setThreadId(crypto.randomUUID()), []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <HistoryRail
          activeId={threadId}
          collapsed={railCollapsed}
          onNew={newThread}
          onPick={openThread}
          onToggle={() => setRailCollapsed((value) => !value)}
          reloadKey={reloadKey}
        />
        <CopilotKitProvider
          // Inspector bật mặc định ở dev và chèn cả banner quảng cáo sản phẩm của CopilotKit
          // vào giữa trang giảng viên. `showDevConsole` KHÔNG còn điều khiển nó (đã deprecated);
          // `enableInspector` mới là cờ đúng.
          enableInspector={false}
          // Tầng Node cùng origin, không phải Kong: xem `app/api/copilotkit/[[...path]]/route.ts`.
          runtimeUrl="/api/copilotkit"
        >
          {/* Trước <ChatPanel>: effect của con chạy theo thứ tự khai báo, header phải có
              trước lần connect đầu tiên. */}
          <AuthHeaderSync />
          <ToolRenderers />
          <LecterHumanInTheLoop />
          <ChatPanel onRunEnd={() => setReloadKey((value) => value + 1)} threadId={threadId} />
        </CopilotKitProvider>
      </div>
    </div>
  );
}
