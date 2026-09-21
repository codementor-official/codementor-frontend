/**
 * Runtime CopilotKit của Lecter — tầng Node giữa trình duyệt và ai-service.
 *
 * Trước đây trình duyệt POST thẳng tới FastAPI qua `selfManagedAgents`. Nó chạy được, nhưng
 * `selfManagedAgents` thuộc gói Enterprise Intelligence của CopilotKit và cảnh báo ở mọi lần
 * mount. Route này là đường OSS: `CopilotRuntime` ở chế độ SSE, không license, không
 * Intelligence Platform.
 *
 * Trình duyệt không còn giữ access token. Route đọc phiên HttpOnly, gia hạn khi cần rồi gắn
 * `Authorization` vào request nội bộ; ai-service vẫn tự verify JWT Keycloak trên
 * `/api/v1/ai/*`. Refresh token không bao giờ rời khỏi cookie đã mã hóa.
 */

import { EventType, HttpAgent, type BaseEvent, type Message } from "@ag-ui/client";
import {
  AgentRunner,
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
  type AgentRunnerConnectRequest,
  type AgentRunnerIsRunningRequest,
  type AgentRunnerRunRequest,
  type AgentRunnerStopRequest,
} from "@copilotkit/runtime/v2";
import { Observable, from, mergeMap } from "rxjs";
import { NextRequest, NextResponse } from "next/server";
import { clearSession, needsRefresh, readSession, refreshSession, setSession } from "@/features/auth/server/session";

/**
 * Cùng tên với `LangGraphAgent(name="lecter")` ở ai-service và với `LECTER_AGENT_ID` trong
 * `features/lecter/lecter-page.tsx`.
 */
const AGENT_ID = "lecter";

/**
 * Gateway nhìn từ phía server, không phải từ trình duyệt.
 *
 * `NEXT_PUBLIC_API_BASE_URL` là URL trình duyệt dùng; khi Next chạy trong container thì nó
 * thường không phải địa chỉ mà tiến trình Node gọi được. `AI_SERVICE_URL` là chỗ ghi đè.
 */
const apiBaseUrl = (
  process.env.AI_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

/**
 * Nạp lại lịch sử khi mở một hội thoại cũ.
 *
 * `<CopilotChat threadId=…>` — bắt buộc để phiên không bị tách — khiến client gọi
 * `/agent/lecter/connect` lúc mount và tự xoá sạch messages trước đó: nó giả định transport sẽ
 * phát lại lịch sử. Ở chế độ SSE, `connect` KHÔNG chạm tới agent, nó đọc một kho trong bộ nhớ
 * tiến trình — kho đó vừa rỗng sau mỗi lần Next tái tạo isolate, vừa đánh theo threadId mà
 * không lọc theo người dùng. Nên bỏ hẳn, và đọc từ nguồn thật: `ai_agent_sessions` của
 * ai-service, vốn đã lọc theo `userId` trong token (404 nếu thread không phải của người gọi).
 *
 * BỌC `InMemoryAgentRunner` chứ không kế thừa nó, vì cờ `ɵsupportsLocalThreadEndpoints` của nó
 * bật thêm `GET /threads`, `/threads/:id/messages`, `/threads/:id/events` — KHÔNG có xác thực,
 * đọc thẳng kho trong bộ nhớ. Trên route này thì đó là lịch sử soạn bài của mọi giảng viên đã
 * dùng tiến trình Node đó, mở cho bất kỳ ai gọi được URL. Bọc lại thì cờ không tồn tại và các
 * route ấy không được đăng ký; `run` vẫn là bản gốc.
 */
class LecterRunner extends AgentRunner {
  private readonly inner = new InMemoryAgentRunner();

  connect(request: AgentRunnerConnectRequest): Observable<BaseEvent> {
    return from(restore(request)).pipe(mergeMap((events) => from(events)));
  }

  run(request: AgentRunnerRunRequest): Observable<BaseEvent> {
    return this.inner.run(request);
  }

  isRunning(request: AgentRunnerIsRunningRequest): Promise<boolean> {
    return this.inner.isRunning(request);
  }

  stop(request: AgentRunnerStopRequest): Promise<boolean | undefined> {
    return this.inner.stop(request);
  }
}

async function restore(request: AgentRunnerConnectRequest): Promise<BaseEvent[]> {
  const token = request.headers?.authorization ?? request.headers?.Authorization;
  if (!token) return [];
  try {
    const response = await fetch(
      `${apiBaseUrl}/ai/lecter/sessions/${encodeURIComponent(request.threadId)}`,
      { headers: { Authorization: token } },
    );
    // 404 = hội thoại mới, hoặc thread của người khác. Cả hai đều là "không có gì để phát lại".
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { messages?: Message[] } };
    const messages = body.data?.messages ?? [];
    if (messages.length === 0) return [];
    // Client kiểm chứng luồng sự kiện và từ chối nếu sự kiện đầu không phải RUN_STARTED
    // ("First event must be 'RUN_STARTED'"). Bản phát lại của `InMemoryAgentRunner` thoả điều
    // đó nhờ vô tình chép lại nguyên các run cũ; ở đây phải tự đóng khung.
    const runId = crypto.randomUUID();
    const threadId = request.threadId;
    return [
      { type: EventType.RUN_STARTED, threadId, runId },
      { type: EventType.MESSAGES_SNAPSHOT, messages },
      { type: EventType.RUN_FINISHED, threadId, runId },
    ] as BaseEvent[];
  } catch (error) {
    console.error("Lecter: không nạp được lịch sử hội thoại", error);
    return [];
  }
}

const runtime = new CopilotRuntime({
  agents: { [AGENT_ID]: new HttpAgent({ url: `${apiBaseUrl}/ai/lecter/run` }) },
  runner: new LecterRunner(),
});

const handler = createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit" });

async function proxy(request: NextRequest): Promise<Response> {
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }
  let session = await readSession(request);
  if (!session) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  let refreshed = false;
  try {
    refreshed = needsRefresh(session);
    if (refreshed) session = await refreshSession(session);
  } catch {
    const response = NextResponse.json({ message: "Session expired" }, { status: 401 });
    clearSession(response);
    return response;
  }
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${session.accessToken}`);
  const forwarded = new Request(request.url, {
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    duplex: "half", headers, method: request.method, signal: request.signal,
  } as RequestInit & { duplex: "half" });
  const upstream = await handler(forwarded);
  if (!refreshed) return upstream;
  const response = new NextResponse(upstream.body, { headers: upstream.headers,
    status: upstream.status, statusText: upstream.statusText });
  await setSession(response, session);
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;

// SSE: không được để Next đệm hay cache lượt chạy.
export const dynamic = "force-dynamic";
