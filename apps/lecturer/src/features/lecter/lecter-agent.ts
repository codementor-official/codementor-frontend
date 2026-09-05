import {
  HttpAgent,
  type HttpAgentConfig,
  type Message,
  type RunAgentInput,
  type RunAgentResult,
} from "@copilotkit/react-core/v2";
import { apiBaseUrl } from "@/lib/env";
import { readAccessToken } from "@/lib/api";

export const LECTER_AGENT_ID = "lecter";

/**
 * Agent Lecter, nói thẳng với ai-service.
 *
 * Không có `@copilotkit/runtime` ở giữa: `selfManagedAgents` cho phép trình duyệt POST trực tiếp
 * tới endpoint AG-UI, và ai-service tự verify JWT Keycloak trên `/api/v1/ai/*` (`app/auth.py`).
 * Thêm một Node runtime chỉ để chuyển tiếp một lời gọi là thêm một tầng nữa để hỏng.
 *
 * `requestInit` được override vì `HttpAgent` chốt `headers` lúc dựng: một phiên soạn bài kéo dài
 * hơn tuổi thọ access token, và token cũ thì mọi lượt sau trả 401 — triệu chứng trông y hệt
 * "agent tự nhiên hỏng". Đọc lại token ở từng request là chỗ duy nhất sửa được việc đó.
 */
export class LecterAgent extends HttpAgent {
  /** Bản chụp lịch sử nạp từ `GET /ai/lecter/sessions/:id`, dùng lại ở `connectAgent`. */
  private readonly restoreMessages: Message[];

  constructor({ restoreMessages, ...config }: HttpAgentConfig & { restoreMessages?: Message[] }) {
    super(config);
    this.restoreMessages = restoreMessages ?? [];
  }

  /**
   * Nạp lại lịch sử của hội thoại đang mở, và không gọi mạng.
   *
   * `<CopilotChat threadId=…>` — bắt buộc để phiên không bị tách, xem `lecter-page.tsx` — khiến
   * CopilotKit gọi `connectAgent` lúc mount. Trước khi gọi, `RunHandler.connectAgent` chạy
   * `agent.setMessages([])`: nó giả định transport sẽ tự phát lại lịch sử từ gateway của
   * Intelligence Platform. Ở đây không có gateway nào — lịch sử đến từ Mongo của chính dự án —
   * nên nếu chỉ trả về rỗng thì mở một hội thoại cũ sẽ ra khung chat trắng.
   *
   * Chỉ nạp lại khi agent đang rỗng: cùng một hàm còn được gọi ở lần re-connect trong cùng luồng
   * (effect churn), và lúc đó ghi đè bằng bản chụp cũ sẽ xoá mất những lượt vừa nói.
   *
   * Override ở tầng `connectAgent` (public) chứ không phải `connect()` (protected, trả Observable)
   * để không phải kéo rxjs vào làm dependency trực tiếp chỉ vì mấy dòng này.
   */
  async connectAgent(): Promise<RunAgentResult> {
    if (this.messages.length === 0 && this.restoreMessages.length > 0) {
      this.setMessages([...this.restoreMessages]);
    }
    return { result: undefined, newMessages: [] };
  }

  protected requestInit(input: RunAgentInput): RequestInit {
    const init = super.requestInit(input);
    return {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${readAccessToken() ?? ""}`,
      },
    };
  }
}

export function createLecterAgent(threadId: string, restoreMessages?: Message[]) {
  return new LecterAgent({
    url: `${apiBaseUrl}/ai/lecter/run`,
    agentId: LECTER_AGENT_ID,
    threadId,
    initialMessages: restoreMessages,
    restoreMessages,
  });
}
