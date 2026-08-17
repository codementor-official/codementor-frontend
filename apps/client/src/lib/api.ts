import { createApiClient } from "@codementor/api-client";
import type { ApiResponse, User } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";
import type { JudgeRunResult } from "@/types/judge";
import type { NotificationPage } from "@/types/notification";
import type {
  ArticleDetail,
  ArticleSummary,
  CatalogueParams,
  CourseDetail,
  CourseSummary,
  ExerciseDetail,
  ExerciseSummary,
  Page,
  RoadmapDetail,
  RoadmapSummary,
} from "@/types/catalogue";

/**
 * The single place that knows a backend URL. Everything below calls the gateway, so
 * moving a resource between services is a change to kong.yml and to nothing here.
 */
let readAccessToken: () => string | null = () => null;

/** Called once by the auth provider; keeps the client free of React imports. */
export function setAccessTokenReader(reader: () => string | null): void {
  readAccessToken = reader;
}

/** Phiên Google/Facebook: token nằm trong tab, gọi thẳng gateway như trước. */
const direct = createApiClient({ baseUrl: apiBaseUrl, getAccessToken: () => readAccessToken() });

/**
 * Phiên đăng nhập bằng mật khẩu: token nằm trong cookie HttpOnly nên trình duyệt không
 * gắn `Authorization` được. Proxy cùng origin ở `/api/backend` gắn hộ phía server.
 */
const viaBff = createApiClient({ baseUrl: "/api/backend" });

function request<T>(path: string, options?: Parameters<typeof direct>[1]): Promise<T> {
  return readAccessToken() ? direct<T>(path, options) : viaBff<T>(path, options);
}

/** Every backend response is wrapped by the response interceptor in libs/platform. */
async function unwrap<T>(path: string, options?: Parameters<typeof request>[1]): Promise<T> {
  const response = await request<ApiResponse<T>>(path, options);
  return response.data;
}

function query(params: CatalogueParams | Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export const api = {
  me: () => unwrap<User>("/me"),

  /**
   * The public catalogue: published, public content from every author.
   *
   * These are the same gateway routes the lecturer app calls, but only the read side —
   * a learner browses, it does not author. The `/…/mine` variants are deliberately absent.
   */
  roadmaps: {
    catalogue: (params: CatalogueParams = {}) =>
      unwrap<Page<RoadmapSummary>>(`/roadmaps${query(params)}`),
    /** Takes the UUID, not the slug — the service has no slug lookup. */
    detail: (id: string) => unwrap<RoadmapDetail>(`/roadmaps/${id}`),
  },
  courses: {
    catalogue: (params: CatalogueParams = {}) =>
      unwrap<Page<CourseSummary>>(`/courses${query(params)}`),
    detail: (id: string) => unwrap<CourseDetail>(`/courses/${id}`),
  },
  exercises: {
    bank: (params: CatalogueParams = {}) =>
      unwrap<Page<ExerciseSummary>>(`/exercises${query(params)}`),
    /** Takes the UUID, not the slug — the service has no slug lookup. */
    detail: (id: string) => unwrap<ExerciseDetail>(`/exercises/${id}`),
  },

  /**
   * Bài viết. Trước đây trang `/articles` đọc `src/data/articles.ts` — nghĩa là bài admin
   * vừa đăng, và cả liên kết trong thông báo trỏ tới nó, đều ra 404.
   */
  articles: {
    catalogue: (params: CatalogueParams & { tag?: string } = {}) =>
      unwrap<Page<ArticleSummary>>(`/articles${query(params)}`),
    tags: () => unwrap<{ name: string; count: number }[]>("/articles/tags"),
    read: (slug: string) => unwrap<ArticleDetail>(`/articles/${slug}`),
  },

  /**
   * Lịch sử thông báo. WebSocket chỉ mang thông báo phát sinh khi tab đang mở; mọi thứ
   * còn lại — đăng nhập lại, F5, vừa hết mạng — đều đọc từ đây.
   */
  notifications: {
    list: (params: { limit?: number; before?: string } = {}) =>
      unwrap<NotificationPage>(`/notifications${query(params)}`),
    unreadCount: () => unwrap<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) =>
      unwrap<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () => unwrap<{ marked: number }>("/notifications/read-all", { method: "PATCH" }),
  },

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
