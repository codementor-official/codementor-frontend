import type { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";

/**
 * Ba loại nội dung, ba service, ba đường dẫn — không có endpoint gộp ở backend, vì một
 * endpoint như thế buộc một service đọc bảng của service khác.
 */
export type ContentKind = "exercises" | "courses" | "roadmaps";
export type ModerationDecision = "approve" | "request_changes" | "reject" | "archive";

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

/**
 * Hàm gọi do `useAdminApi()` trả về. Mọi lời gọi đi qua `/api/backend`, nơi BFF gắn
 * access token phía server — trình duyệt không bao giờ cầm token.
 *
 * Lấy kiểu từ chính `createApiClient` thay vì tự khai lại: khai lại thì hai bên trôi
 * khỏi nhau mà không ai báo.
 */
type Request = ReturnType<typeof createApiClient>;

async function unwrap<T>(request: Request, path: string, options?: Parameters<Request>[1]) {
  const response = await request<ApiResponse<T>>(path, options);
  return response.data;
}

export const moderationApi = {
  queue: (request: Request, kind: ContentKind) =>
    unwrap<Page<QueueItem>>(request, `/${kind}/moderation?limit=50`),
  decide: (
    request: Request,
    kind: ContentKind,
    id: string,
    decision: ModerationDecision,
    reason?: string,
  ) =>
    unwrap<QueueItem>(request, `/${kind}/${id}/moderate`, {
      method: "POST",
      body: { decision, ...(reason ? { reason } : {}) },
    }),
};
