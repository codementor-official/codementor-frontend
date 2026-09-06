"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { LecterCourseHumanInTheLoop } from "./hitl-course";
import { LecterComposer } from "./lecter-composer";
import { ToolRenderers } from "./tool-renderers";

/** Cùng tên với `LangGraphAgent(name="lecter")` ở ai-service và khoá agent trong route runtime. */
const LECTER_AGENT_ID = "lecter";

/** Trễ tối đa giữa lúc token được gia hạn và lúc CopilotKit biết. */
const TOKEN_SYNC_MS = 30_000;

function bearer(): string {
  return `Bearer ${readAccessToken() ?? ""}`;
}

/**
 * Giữ cho header `Authorization` của CopilotKit luôn là token hiện hành.
 *
 * `AuthProvider` giữ token trong `useRef` và CỐ TÌNH không re-render khi `automaticSilentRenew`
 * đổi token (~5 phút một lần, token Keycloak sống 300s), còn CopilotKit trải phẳng prop
 * `headers` MỘT LẦN bằng `Object.entries` rồi giữ bản sao. Nên getter hay hàm đặt trong prop đó
 * đều vô dụng, và không có cầu nối này thì sau ~5 phút mọi lượt trả 401.
 *
 * So sánh với `copilotkit.headers` chứ không với một ref cục bộ: `CopilotKitProvider` cũng gọi
 * `setHeaders(mergedHeaders)` trong effect CỦA CHÍNH NÓ, mà effect của cha chạy SAU effect của
 * con — mọi giá trị đặt ở đây lúc mount đều bị nó ghi đè. Đọc lại trạng thái thật của core
 * khiến vòng này tự chữa: lần chạy kế tiếp thấy header sai thì đặt lại. Giá trị đúng ngay từ
 * request đầu tiên đến từ prop `headers` của trang, không phải từ đây.
 *
 * ponytail: hỏi thăm theo chu kỳ thay vì nghe sự kiện `userLoaded` của oidc-client-ts — ngắn
 * hơn, và bắt được cả trường hợp header bị ghi đè chứ không chỉ lúc token đổi.
 */
function AuthHeaderSync() {
  const { copilotkit } = useCopilotKit();

  useEffect(() => {
    const apply = () => {
      const value = bearer();
      if (copilotkit.headers?.Authorization === value) return;
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
          /* Slot, không phải prop: `inputValue`/`onInputChange`/`onSubmitMessage` truyền
             thẳng cho <CopilotChat> đều bị chính nó ghi đè. Xem `lecter-composer.tsx`. */
          input={LecterComposer}
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
  const router = useRouter();
  // Hội thoại đang mở nằm trong URL, không phải trong state. Trước đây nó là `useState`, nên bấm
  // "Mở Studio" rồi nhấn Back là quay về `/lecter` trắng trơn — hội thoại vừa nãy không có địa
  // chỉ nào để quay lại. `/lecter` và `/lecter/[id]` dùng chung đúng component này.
  const routeId = useParams<{ id?: string }>().id;
  // Id cho lần mở `/lecter` trần. Sinh một lần rồi đẩy vào URL ngay, chứ không đợi tin nhắn đầu:
  // người soạn có thể bấm "Mở Studio" từ thẻ kết quả trước khi kịp gõ gì thêm.
  const [freshId] = useState(() => crypto.randomUUID());
  const threadId = routeId ?? freshId;

  // Token lúc mở trang. Đây là đường duy nhất đặt được header TRƯỚC lần gọi đầu tiên: provider
  // đẩy `mergedHeaders` vào core trong effect của nó, sau mọi effect con. Định danh phải ổn định
  // — object mới mỗi lần render sẽ khiến provider chạy lại effect đó (kèm `connect()`) liên tục.
  // Gia hạn về sau do <AuthHeaderSync> lo.
  const initialAuthHeaders = useMemo(() => ({ Authorization: bearer() }), []);
  const [reloadKey, setReloadKey] = useState(0);
  const [railCollapsed, setRailCollapsed] = useState(false);

  useEffect(() => {
    // `replace` chứ không `push`: `/lecter` trần không đáng chiếm một mục trong lịch sử trình
    // duyệt, Back từ đây phải về trang trước đó chứ không kẹt lại chính nó.
    if (!routeId) router.replace(`/lecter/${freshId}`);
  }, [routeId, freshId, router]);

  // Đổi hội thoại là điều hướng thật: URL đổi thì `threadId` đổi, CopilotKit gọi lại
  // `/agent/lecter/connect`, và route runtime phát lại lịch sử từ `ai_agent_sessions`.
  const openThread = useCallback((id: string) => router.push(`/lecter/${id}`), [router]);
  const newThread = useCallback(
    () => router.push(`/lecter/${crypto.randomUUID()}`),
    [router],
  );

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
          headers={initialAuthHeaders}
          // Tầng Node cùng origin, không phải Kong: xem `app/api/copilotkit/[[...path]]/route.ts`.
          runtimeUrl="/api/copilotkit"
        >
          {/* Trước <ChatPanel>: effect của con chạy theo thứ tự khai báo, header phải có
              trước lần connect đầu tiên. */}
          <AuthHeaderSync />
          <ToolRenderers />
          <LecterHumanInTheLoop />
          <LecterCourseHumanInTheLoop />
          <ChatPanel onRunEnd={() => setReloadKey((value) => value + 1)} threadId={threadId} />
        </CopilotKitProvider>
      </div>
    </div>
  );
}
