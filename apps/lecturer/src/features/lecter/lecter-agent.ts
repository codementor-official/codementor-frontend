import { HttpAgent, type RunAgentInput } from "@copilotkit/react-core/v2";
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

export function createLecterAgent(threadId: string, initialMessages?: RunAgentInput["messages"]) {
  return new LecterAgent({
    url: `${apiBaseUrl}/ai/lecter/run`,
    agentId: LECTER_AGENT_ID,
    threadId,
    initialMessages,
  });
}
