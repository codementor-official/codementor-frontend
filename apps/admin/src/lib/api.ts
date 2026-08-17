import type { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";

/**
 * Ba loại nội dung, ba service, ba đường dẫn — không có endpoint gộp ở backend, vì một
 * endpoint như thế buộc một service đọc bảng của service khác.
 */
export type ContentKind = "exercises" | "courses" | "roadmaps";
/**
 * `restore` takes archived content back to `draft` so it walks the review flow again —
 * there is no path from archived straight to published, by design.
 */
export type ModerationDecision =
  | "approve"
  | "request_changes"
  | "reject"
  | "archive"
  | "restore";

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

/* ------------------------------------------------------------------- Users */

export interface AdminUser {
  id: string;
  /** `sub` của Keycloak. Null nghĩa là hàng này chưa gắn với tài khoản Keycloak nào. */
  externalId: string | null;
  email: string;
  handle: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersQuery extends Record<string, string | number | undefined> {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

function search(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export const usersApi = {
  list: (request: Request, query: UsersQuery = {}) =>
    unwrap<Page<AdminUser>>(request, `/users${search(query)}`),
  summary: (request: Request) =>
    unwrap<{ total: number; byRole: Record<string, number> }>(request, "/users/summary"),
};

/* ---------------------------------------------------------------- Articles */

export interface AdminArticle {
  rejectionReason: string | null;
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: string;
  readMinutes: number | null;
  authorId: string | null;
  authorName: string | null;
  tagName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetail extends AdminArticle {
  takeaway: string | null;
  rejectionReason: string | null;
  tagId: string | null;
  contentHtml: string;
}

export const articlesApi = {
  list: (request: Request, query: { q?: string; status?: string; limit?: number; cursor?: string } = {}) =>
    unwrap<Page<AdminArticle>>(request, `/articles/manage${search(query)}`),
  detail: (request: Request, id: string) => unwrap<ArticleDetail>(request, `/articles/manage/${id}`),
  summary: (request: Request) => unwrap<Record<string, number>>(request, "/articles/manage/summary"),
  create: (request: Request, body: { title: string; slug?: string }) =>
    unwrap<ArticleDetail>(request, "/articles", { method: "POST", body }),
  update: (
    request: Request,
    id: string,
    body: { title?: string; slug?: string; excerpt?: string; takeaway?: string; readMinutes?: number },
  ) => unwrap<ArticleDetail>(request, `/articles/${id}`, { method: "PATCH", body }),
  saveContent: (request: Request, id: string, contentHtml: string) =>
    unwrap<ArticleDetail>(request, `/articles/${id}/content`, {
      method: "PUT",
      body: { contentHtml },
    }),
  /** Bốn nhánh giống hệt kiểm duyệt khoá học/lộ trình/bài code. */
  moderate: (
    request: Request,
    id: string,
    decision: ModerationDecision,
    reason?: string,
  ) =>
    unwrap<ArticleDetail>(request, `/articles/${id}/moderate`, {
      method: "POST",
      body: { decision, ...(reason ? { reason } : {}) },
    }),
  remove: (request: Request, id: string) =>
    unwrap<void>(request, `/articles/${id}`, { method: "DELETE" }),
};
