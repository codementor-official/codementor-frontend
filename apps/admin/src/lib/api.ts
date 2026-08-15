import { createApiClient } from "@codementor/api-client";
import type { ApiResponse, User } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";

let readAccessToken: () => string | null = () => null;

export function setAccessTokenReader(reader: () => string | null): void {
  readAccessToken = reader;
}

const request = createApiClient({ baseUrl: apiBaseUrl, getAccessToken: () => readAccessToken() });

async function unwrap<T>(path: string, options?: Parameters<typeof request>[1]): Promise<T> {
  const response = await request<ApiResponse<T>>(path, options);
  return response.data;
}

export type ModerationDecision = "approve" | "request_changes" | "reject" | "archive";

/** Ba loại nội dung, ba service, ba đường dẫn — không có endpoint gộp. */
export type ContentKind = "exercises" | "courses" | "roadmaps";

export interface QueueItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  authorName: string | null;
  /** Do màn admin gắn thêm sau khi gộp ba hàng chờ; API không trả trường này. */
  kind?: ContentKind;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export const api = {
  me: () => unwrap<User>("/me"),
  queue: (kind: ContentKind) => unwrap<Page<QueueItem>>(`/${kind}/moderation?limit=50`),
  moderate: (kind: ContentKind, id: string, decision: ModerationDecision, reason?: string) =>
    unwrap<QueueItem>(`/${kind}/${id}/moderate`, {
      method: "POST",
      body: { decision, ...(reason ? { reason } : {}) },
    }),
};
