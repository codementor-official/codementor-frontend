import { createApiClient } from "@codementor/api-client";
import type { ApiResponse, User } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";
import type { JudgeRunResult } from "@/types/judge";

/**
 * The single place that knows a backend URL. Everything below calls the gateway, so
 * moving a resource between services is a change to kong.yml and to nothing here.
 */
let readAccessToken: () => string | null = () => null;

/** Called once by the auth provider; keeps the client free of React imports. */
export function setAccessTokenReader(reader: () => string | null): void {
  readAccessToken = reader;
}

const request = createApiClient({
  baseUrl: apiBaseUrl,
  getAccessToken: () => readAccessToken(),
});

/** Every backend response is wrapped by the response interceptor in libs/platform. */
async function unwrap<T>(path: string, options?: Parameters<typeof request>[1]): Promise<T> {
  const response = await request<ApiResponse<T>>(path, options);
  return response.data;
}

export const api = {
  me: () => unwrap<User>("/me"),

  /**
   * judge-service chấm đồng bộ trong sandbox Docker. Đây là đường chạy thử: không tạo bài
   * nộp, không ghi lịch sử. Bài nộp thật sẽ đi qua submission-service và Kafka khi service
   * đó được viết.
   */
  judge: {
    run: (body: {
      language: string;
      sourceCode: string;
      timeLimitMs: number;
      memoryLimitKb: number;
      testCases: { order: number; input: string; expected: string; weight?: number }[];
    }) => unwrap<JudgeRunResult>("/judge/run", { method: "POST", body }),
  },
};
