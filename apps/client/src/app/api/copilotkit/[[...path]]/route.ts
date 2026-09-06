/**
 * Runtime CopilotKit của Lecter phía học viên — tầng Node giữa trình duyệt và ai-service.
 *
 * Khác bản của `apps/lecturer` đúng một điểm, và đó là điểm quan trọng nhất: **ở đây trình duyệt
 * không chắc có token**. `apps/client` có hai loại phiên (`lib/api.ts`): đăng nhập Google/Facebook
 * giữ token trong tab và gắn được `Authorization`; đăng nhập bằng mật khẩu thì token nằm trong
 * cookie HttpOnly và JavaScript không đọc được — mọi lời gọi API của họ đi qua proxy
 * `/api/backend` được gắn token phía server. Nếu route này chỉ forward header như bên giảng viên
 * thì một nửa người dùng nhận 401 ngay lượt đầu.
 *
 * Nên: có header thì cho qua nguyên; không có thì đọc phiên từ cookie, gia hạn nếu sắp hết, và
 * gắn hộ. Gia hạn xong phải ghi lại cookie — Keycloak có thể bật xoay vòng refresh token, và giữ
 * bản cũ trong cookie sẽ giết phiên ở lần gọi sau.
 *
 * Tầng này không giữ credential nào của riêng nó: nó chỉ chuyển tiếp token của chính người dùng,
 * và ai-service vẫn tự verify JWT Keycloak trên `/api/v1/ai/*`.
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
import { NextRequest, NextResponse } from "next/server";
import { Observable, from, mergeMap } from "rxjs";
import {
  readSession,
  refreshWebSession,
  sessionNeedsRefresh,
  setSessionCookies,
  type WebSession,
} from "@/features/auth/server/auth-session";

/** Cùng tên với `Capability.agent_id` = "lecter_workspace" ở ai-service. */
const AGENT_ID = "lecter_workspace";

/**
 * Gateway nhìn từ phía server, không phải từ trình duyệt: khi Next chạy trong container thì
 * `NEXT_PUBLIC_API_BASE_URL` thường không phải địa chỉ mà tiến trình Node gọi được.
 */
const apiBaseUrl = (
  process.env.AI_SERVICE_URL ??
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

/**
 * Nhóm học của lượt chạy này.
 *
 * Trình duyệt gửi nó trong đường dẫn (`/api/copilotkit/w/<slug>/...`) chứ không trong thân yêu
 * cầu: `createCopilotRuntimeHandler` đọc thân để định tuyến, và một khoá lạ thêm vào đó sẽ bị
 * schema của nó từ chối. Không phải cơ chế bảo mật — ai-service tự kiểm quyền theo slug bằng
 * token của người gọi, nên slug bịa ra chỉ nhận 403.
 */
const SLUG_PREFIX = "/api/copilotkit/w/";

function slugOf(request: Request): string {
  const path = new URL(request.url).pathname;
  if (!path.startsWith(SLUG_PREFIX)) return "";
  return decodeURIComponent(path.slice(SLUG_PREFIX.length).split("/")[0] ?? "");
}

function agentUrl(slug: string): string {
  return `${apiBaseUrl}/ai/lecter/workspace/${encodeURIComponent(slug)}/run`;
}

/**
 * Nạp lại lịch sử khi mở một hội thoại cũ.
 *
 * `<CopilotChat threadId=…>` khiến client gọi `/agent/<id>/connect` lúc mount và tự xoá sạch
 * messages trước đó: nó giả định transport sẽ phát lại lịch sử. Ở chế độ SSE, `connect` KHÔNG
 * chạm tới agent — nó đọc một kho trong bộ nhớ tiến trình, vừa rỗng sau mỗi lần Next tái tạo
 * isolate, vừa đánh theo threadId mà không lọc theo người dùng. Nên bỏ hẳn, đọc từ nguồn thật:
 * `ai_agent_sessions` của ai-service, vốn đã lọc theo người gọi và theo nhóm.
 */
async function restore(request: AgentRunnerConnectRequest): Promise<BaseEvent[]> {
  const token = request.headers?.authorization ?? request.headers?.Authorization;
  const slug = request.headers?.["x-workspace-slug"];
  if (!token || !slug) return [];
  try {
    const response = await fetch(
      `${apiBaseUrl}/ai/lecter/workspace/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(request.threadId)}`,
      { headers: { Authorization: token } },
    );
    // 404 = hội thoại mới, hoặc thread của người khác. Cả hai đều là "không có gì để phát lại".
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { messages?: Message[] } };
    const messages = body.data?.messages ?? [];
    if (messages.length === 0) return [];
    // Client kiểm chứng luồng sự kiện và từ chối nếu sự kiện đầu không phải RUN_STARTED.
    const runId = crypto.randomUUID();
    const threadId = request.threadId;
    return [
      { type: EventType.RUN_STARTED, threadId, runId },
      { type: EventType.MESSAGES_SNAPSHOT, messages },
      { type: EventType.RUN_FINISHED, threadId, runId },
    ] as BaseEvent[];
  } catch (error) {
    console.error("[lecter] không nạp được lịch sử hội thoại", error);
    return [];
  }
}

/**
 * BỌC `InMemoryAgentRunner` chứ không kế thừa: cờ `ɵsupportsLocalThreadEndpoints` của nó bật
 * thêm `GET /threads`, `/threads/:id/messages`, `/threads/:id/events` — KHÔNG có xác thực, đọc
 * thẳng kho trong bộ nhớ. Trên route này thì đó là hội thoại soạn bài của mọi người đã dùng
 * tiến trình Node đó, mở cho bất kỳ ai gọi được URL. Bọc lại thì cờ không tồn tại.
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

/**
 * Một runtime cho mỗi nhóm: `CopilotRuntime` giữ URL agent trong `HttpAgent` lúc dựng, nên URL
 * không đổi được theo từng yêu cầu. Cache theo slug để mỗi nhóm chỉ dựng một lần.
 */
const handlers = new Map<string, ReturnType<typeof createCopilotRuntimeHandler>>();

function handlerFor(slug: string) {
  const cached = handlers.get(slug);
  if (cached) return cached;
  const runtime = new CopilotRuntime({
    agents: { [AGENT_ID]: new HttpAgent({ url: agentUrl(slug) }) },
    runner: new LecterRunner(),
  });
  const handler = createCopilotRuntimeHandler({
    runtime,
    basePath: `${SLUG_PREFIX}${encodeURIComponent(slug)}`,
  });
  handlers.set(slug, handler);
  return handler;
}

/** Token của lượt này, cùng phiên đã gia hạn nếu có gia hạn. */
async function authorize(
  request: NextRequest,
): Promise<{ token: string | null; refreshed: WebSession | null }> {
  const header = request.headers.get("authorization");
  // Phiên popup: token nằm trong tab và trình duyệt đã gắn sẵn. Kiểm phần SAU chữ "Bearer":
  // CopilotKit trải phẳng prop `headers` một lần, nên một `"Bearer "` rỗng lúc mount vẫn còn
  // nguyên ở đây — chuyển tiếp nó là gửi đi một header hỏng thay vì dùng cookie.
  if (header?.replace(/^Bearer\s*/i, "").trim()) return { token: header, refreshed: null };

  let session = await readSession(request);
  if (!session) return { token: null, refreshed: null };
  let refreshed: WebSession | null = null;
  if (sessionNeedsRefresh(session)) {
    try {
      session = await refreshWebSession(session);
      refreshed = session;
    } catch (error) {
      // Không xoá cookie ở đây: refresh hỏng có thể chỉ là Keycloak nghẽn một giây, và phiên
      // vẫn còn hiệu lực. Cứ gửi token cũ đi — nếu nó hết hạn thật thì ai-service trả 401.
      console.error("[lecter] gia hạn phiên thất bại, dùng token hiện có", error);
    }
  }
  return { token: `Bearer ${session.accessToken}`, refreshed };
}

async function proxy(request: NextRequest): Promise<Response> {
  const slug = slugOf(request);
  if (!slug) {
    return NextResponse.json({ message: "Thiếu nhóm học trong đường dẫn." }, { status: 400 });
  }

  const { token, refreshed } = await authorize(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  // Header đi tiếp tới ai-service: `forwardHeaders` của CopilotRuntime cho qua `authorization`
  // và mọi header `x-*`, nên slug đi kèm dưới dạng `x-workspace-slug` để `restore()` đọc được.
  const headers = new Headers(request.headers);
  headers.set("authorization", token);
  headers.set("x-workspace-slug", slug);

  const forwarded = new Request(request.url, {
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    duplex: "half",
    headers,
    method: request.method,
    signal: request.signal,
  } as RequestInit & { duplex: "half" });

  const upstream = await handlerFor(slug)(forwarded);
  if (!refreshed) return upstream;

  // Phiên vừa gia hạn: ghi lại cookie, nếu không thì lần sau còn cầm refresh token cũ.
  const response = new NextResponse(upstream.body, {
    headers: upstream.headers,
    status: upstream.status,
    statusText: upstream.statusText,
  });
  await setSessionCookies(response, refreshed);
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;

// SSE: không được để Next đệm hay cache lượt chạy.
export const dynamic = "force-dynamic";
