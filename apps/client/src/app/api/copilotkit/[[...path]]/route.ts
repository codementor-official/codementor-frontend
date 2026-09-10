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

/**
 * Hai bề mặt agent đi chung tầng Node này, phân biệt bằng đoạn đầu của đường dẫn.
 *
 * Một tệp chứ không phải hai: phần khó của route này — gắn token cho phiên đăng nhập bằng mật
 * khẩu, gia hạn rồi ghi lại cookie, bọc `InMemoryAgentRunner` để không mở endpoint thiếu xác
 * thực — giống hệt nhau cho mọi bề mặt. Chép sang tệp thứ hai là chép cả ba thứ đó.
 *
 * `agentId` phải trùng với `Capability.agent_id` ở ai-service và với `runtimeAgentId` mà
 * `useAgent`/`<CopilotChat>` khai phía trình duyệt. Lệch một chỗ thì CopilotKit im lặng không
 * tìm thấy agent, không có lỗi nào hiện ra.
 */
const SURFACES = {
  w: {
    agentId: "lecter_workspace",
    run: (id: string) => `/ai/lecter/workspace/${encodeURIComponent(id)}/run`,
    /** Lecter phát lại lịch sử qua `connect`; Codey tự nạp bằng `api.codey.session()`. */
    history: (id: string, threadId: string) =>
      `/ai/lecter/workspace/${encodeURIComponent(id)}/sessions/${encodeURIComponent(threadId)}`,
  },
  codey: {
    agentId: "codey",
    run: () => "/ai/codey/run",
    history: null,
  },
} as const;

type SurfaceKey = keyof typeof SURFACES;

function isSurface(value: string): value is SurfaceKey {
  return value in SURFACES;
}

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
 * Bề mặt và phạm vi của lượt chạy này: `/api/copilotkit/<surface>/<id>/...`.
 *
 * Đi trong ĐƯỜNG DẪN chứ không trong thân yêu cầu: `createCopilotRuntimeHandler` đọc thân để
 * định tuyến, và một khoá lạ thêm vào đó sẽ bị schema của nó từ chối.
 *
 * Không phải cơ chế bảo mật. Với Lecter, ai-service tự kiểm quyền theo slug bằng token của
 * người gọi nên slug bịa ra chỉ nhận 403; với Codey thì `id` là bài đang mở và nó chỉ dùng để
 * gắn nhãn hội thoại trong danh sách lịch sử của chính người gửi.
 */
const BASE_PREFIX = "/api/copilotkit/";

function targetOf(request: Request): { surface: SurfaceKey; id: string } | null {
  const path = new URL(request.url).pathname;
  if (!path.startsWith(BASE_PREFIX)) return null;
  const [head, next] = path.slice(BASE_PREFIX.length).split("/");
  if (!head || !isSurface(head)) return null;
  const id = decodeURIComponent(next ?? "");
  return id ? { surface: head, id } : null;
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
  const surface = request.headers?.["x-agent-surface"];
  const scope = request.headers?.["x-agent-scope"];
  if (!token || !scope || !surface || !isSurface(surface)) return [];
  const history = SURFACES[surface].history;
  if (!history) return [];
  try {
    const response = await fetch(`${apiBaseUrl}${history(scope, request.threadId)}`, {
      headers: { Authorization: token },
    });
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
    console.error("[copilotkit] không nạp được lịch sử hội thoại", error);
    return [];
  }
}

/**
 * BỌC `InMemoryAgentRunner` chứ không kế thừa: cờ `ɵsupportsLocalThreadEndpoints` của nó bật
 * thêm `GET /threads`, `/threads/:id/messages`, `/threads/:id/events` — KHÔNG có xác thực, đọc
 * thẳng kho trong bộ nhớ. Trên route này thì đó là hội thoại soạn bài của mọi người đã dùng
 * tiến trình Node đó, mở cho bất kỳ ai gọi được URL. Bọc lại thì cờ không tồn tại.
 */
class ScopedRunner extends AgentRunner {
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
 * Một runtime cho mỗi (bề mặt, phạm vi): `CopilotRuntime` giữ URL agent trong `HttpAgent` lúc
 * dựng, nên URL không đổi được theo từng yêu cầu. Cache lại để mỗi cặp chỉ dựng một lần.
 */
const handlers = new Map<string, ReturnType<typeof createCopilotRuntimeHandler>>();

function handlerFor(surface: SurfaceKey, id: string) {
  const key = `${surface}:${id}`;
  const cached = handlers.get(key);
  if (cached) return cached;
  const config = SURFACES[surface];
  const runtime = new CopilotRuntime({
    agents: { [config.agentId]: new HttpAgent({ url: `${apiBaseUrl}${config.run(id)}` }) },
    runner: new ScopedRunner(),
  });
  const handler = createCopilotRuntimeHandler({
    runtime,
    basePath: `${BASE_PREFIX}${surface}/${encodeURIComponent(id)}`,
  });
  handlers.set(key, handler);
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
  const target = targetOf(request);
  if (!target) {
    return NextResponse.json({ message: "Đường dẫn agent không hợp lệ." }, { status: 400 });
  }

  const { token, refreshed } = await authorize(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  // Header đi tiếp tới ai-service: `forwardHeaders` của CopilotRuntime cho qua `authorization`
  // và mọi header `x-*`. Phạm vi đi kèm dưới dạng `x-agent-scope` — `restore()` đọc nó, và
  // `app/codey/endpoint.py` dùng nó làm nhãn bài cho hội thoại.
  //
  // Đặt Ở ĐÂY chứ không để trình duyệt gửi: nó đến từ đường dẫn, tức là từ cùng chỗ quyết định
  // URL agent. Nhận từ header của trình duyệt thì hai thứ đó lệch nhau được.
  const headers = new Headers(request.headers);
  headers.set("authorization", token);
  headers.set("x-agent-surface", target.surface);
  headers.set("x-agent-scope", target.id);

  const forwarded = new Request(request.url, {
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    duplex: "half",
    headers,
    method: request.method,
    signal: request.signal,
  } as RequestInit & { duplex: "half" });

  const upstream = await handlerFor(target.surface, target.id)(forwarded);
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
