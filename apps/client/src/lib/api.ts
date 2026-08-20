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
  CourseEnrollment,
  CourseProgress,
  CourseSummary,
  EnrolledCourse,
  ExerciseDetail,
  ExerciseSummary,
  LessonContent,
  LessonProgress,
  Page,
  ProgressStatus,
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
  const response = await request<ApiResponse<T> | undefined>(path, options);
  // 204 No Content — mọi lệnh DELETE trả về thế này. Không có thân thì không có `data` để
  // bóc, và đọc `.data` của `undefined` là chỗ "can't access property data" nổ ra ngay khi
  // xoá thành công: bản ghi đã mất rồi mà màn hình vẫn báo lỗi.
  return response?.data as T;
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

    /** "Khoá học của tôi" — every course I'm enrolled in, most recently active first. */
    mine: () => unwrap<EnrolledCourse[]>("/courses/enrollments/mine"),

    enroll: (id: string, viaRoadmapId?: string) =>
      unwrap<CourseEnrollment>(`/courses/${id}/enroll`, {
        method: "POST",
        body: viaRoadmapId ? { viaRoadmapId } : {},
      }),
    unenroll: (id: string) => unwrap<void>(`/courses/${id}/enroll`, { method: "DELETE" }),

    lessonContent: (courseId: string, lessonId: string) =>
      unwrap<LessonContent | null>(`/courses/${courseId}/lessons/${lessonId}/content`),

    /** Works before enrolling too — `enrollment` is null and the lessons still come back. */
    progress: (id: string) => unwrap<CourseProgress>(`/courses/${id}/progress`),

    /**
     * `timeSpentSeconds` is this session only; the server adds it to the running total.
     * Sending a cumulative figure would double-count on every save.
     */
    recordProgress: (
      courseId: string,
      lessonId: string,
      body: { status: ProgressStatus; timeSpentSeconds?: number; lastPositionSeconds?: number | null },
    ) =>
      unwrap<LessonProgress>(`/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: "PUT",
        body,
      }),
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
      /** Present = grade by calling this function; absent = pipe stdin. */
      spec?: {
        functionName: string;
        parameters: { name: string; type: Record<string, unknown> }[];
        returnType: Record<string, unknown>;
      };
      testCases: {
        order: number;
        input?: string;
        args?: unknown[];
        expected?: unknown;
        weight?: number;
      }[];
      /**
       * Bài code này mở từ trong một khóa học nào. Có mặt + chấm đạt = judge phát
       * `evt.exercise.solved.v1` và learning-service đánh dấu bài học hoàn thành. Vắng mặt
       * là luyện tập tự do: chấm xong là hết, không ghi tiến độ vào đâu.
       */
      context?: { courseId: string; lessonId: string; exerciseId: string };
    }) => unwrap<JudgeRunResult>("/judge/run", { method: "POST", body }),
  },
};
