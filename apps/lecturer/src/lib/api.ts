import { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";
import { apiBaseUrl } from "@/lib/env";
import type { UpdateProfileInput, UserProfile } from "@/features/profile/types";
import type {
  Exercise,
  ExerciseContent,
  ExerciseListItem,
  JudgeRunResult,
  JudgeSpecPayload,
  Page,
} from "@/features/exercises/types";
import type { Roadmap, RoadmapListItem } from "@/features/roadmaps/types";
import type { Course, CourseListItem, LessonContent } from "@/features/courses/types";
import type { Article, ArticleListItem } from "@/features/articles/types";
import type { UiNotification } from "@codementor/ui";

/**
 * The single place that knows a backend URL. Everything below calls the gateway, so
 * moving a resource between services, or putting a different gateway in front, is a
 * change to kong.yml and to nothing in this application.
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
  const response = await request<ApiResponse<T> | undefined>(path, options);
  // 204 No Content — mọi lệnh DELETE trả về thế này. Không có thân thì không có `data` để
  // bóc, và đọc `.data` của `undefined` là chỗ "can't access property data" nổ ra ngay khi
  // xoá thành công: bản ghi đã mất rồi mà màn hình vẫn báo lỗi.
  return response?.data as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

/** Chủ đề dùng chung cho bài viết và bài tập. */
export interface Tag {
  id: string;
  slug: string;
  name: string;
}

/** Tham số danh sách dùng chung; mỗi domain chỉ đọc những khoá nó hiểu. */
export interface ListExercisesParams {
  q?: string;
  difficulty?: string;
  status?: string;
  kind?: string;
  field?: string;
  level?: string;
  cursor?: string;
  limit?: number;
}

export const api = {
  me: () => unwrap<UserProfile>("/me"),
  updateProfile: (input: UpdateProfileInput) =>
    unwrap<UserProfile>("/me", { method: "PATCH", body: { ...input } }),

  exercises: {
    /** Kho bài chung: chỉ bài public đã công khai, mọi tác giả. */
    bank: (params: ListExercisesParams = {}) =>
      unwrap<Page<ExerciseListItem>>(`/exercises${query({ ...params })}`),
    /** Bài của tôi, mọi trạng thái. Hai phạm vi là hai đường dẫn, không phải một cờ. */
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<ExerciseListItem>>(`/exercises/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Exercise>(`/exercises/${id}`),
    create: (body: { title: string; kind: string; difficulty: string; summary?: string | null }) =>
      unwrap<Exercise>("/exercises", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Exercise>(`/exercises/${id}`, { method: "PATCH", body }),
    saveContent: (id: string, content: ExerciseContent) =>
      unwrap<Exercise>(`/exercises/${id}/content`, {
        method: "PUT",
        body: content as Record<string, unknown>,
      }),
    remove: (id: string) => unwrap<void>(`/exercises/${id}`, { method: "DELETE" }),
    fork: (id: string) => unwrap<Exercise>(`/exercises/${id}/fork`, { method: "POST" }),
    submit: (id: string) => unwrap<Exercise>(`/exercises/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Exercise>(`/exercises/${id}/withdraw`, { method: "POST" }),
  },

  roadmaps: {
    catalogue: (params: ListExercisesParams = {}) =>
      unwrap<Page<RoadmapListItem>>(`/roadmaps${query({ ...params })}`),
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<RoadmapListItem>>(`/roadmaps/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}`),
    create: (body: { title: string; field: string; level: string }) =>
      unwrap<Roadmap>("/roadmaps", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Roadmap>(`/roadmaps/${id}`, { method: "PATCH", body }),
    /** Ghi cả danh sách; thứ tự lấy theo thứ tự mảng, backend tự tính lại tổng giờ. */
    replaceCourses: (id: string, courses: { courseId: string; isOptional: boolean }[]) =>
      unwrap<Roadmap>(`/roadmaps/${id}/courses`, { method: "PUT", body: { courses } }),
    submit: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Roadmap>(`/roadmaps/${id}/withdraw`, { method: "POST" }),
    remove: (id: string) => unwrap<void>(`/roadmaps/${id}`, { method: "DELETE" }),
  },

  /**
   * judge-service chấm đồng bộ. Đây là đường "chạy thử": không tạo bài nộp, không ghi lịch
   * sử — giảng viên chỉ muốn biết đề của mình chạy có ra kết quả không.
   */
  judge: {
    run: (body: {
      language: string;
      sourceCode: string;
      timeLimitMs: number;
      memoryLimitKb: number;
      /** Có mặt = chấm theo chữ ký hàm. Vắng mặt = so chuỗi stdout như trước. */
      spec?: JudgeSpecPayload;
      testCases: {
        order: number;
        input?: string;
        args?: unknown[];
        expected?: unknown;
        weight?: number;
      }[];
    }) => unwrap<JudgeRunResult>("/judge/run", { method: "POST", body }),

    /**
     * Mã khởi tạo sinh từ chữ ký hàm.
     *
     * Ở judge chứ không ở client: cùng module đó sinh ra driver, nên chữ ký hai bên không
     * thể lệch nhau. Xem `features/exercises/codegen.ts`.
     */
    starter: (body: { languages: string[]; spec: JudgeSpecPayload }) =>
      unwrap<{ starters: Record<string, string>; unsupported: Record<string, string> }>(
        "/judge/starter",
        { method: "POST", body },
      ),
  },

  courses: {
    catalogue: (params: ListExercisesParams = {}) =>
      unwrap<Page<CourseListItem>>(`/courses${query({ ...params })}`),
    mine: (params: ListExercisesParams = {}) =>
      unwrap<Page<CourseListItem>>(`/courses/mine${query({ ...params })}`),
    get: (id: string) => unwrap<Course>(`/courses/${id}`),
    create: (body: { title: string; level: string }) =>
      unwrap<Course>("/courses", { method: "POST", body }),
    update: (id: string, body: Record<string, unknown>) =>
      unwrap<Course>(`/courses/${id}`, { method: "PATCH", body }),
    /** Ghi cả cây; thứ tự lấy theo thứ tự mảng, id giữ nguyên để không mất tiến độ. */
    saveCurriculum: (id: string, chapters: unknown[]) =>
      unwrap<Course>(`/courses/${id}/curriculum`, { method: "PUT", body: { chapters } }),
    lessonContent: (id: string, lessonId: string) =>
      unwrap<LessonContent | null>(`/courses/${id}/lessons/${lessonId}/content`),
    saveLessonContent: (id: string, lessonId: string, content: LessonContent) =>
      unwrap<LessonContent>(`/courses/${id}/lessons/${lessonId}/content`, {
        method: "PUT",
        body: content as Record<string, unknown>,
      }),
    submit: (id: string) => unwrap<Course>(`/courses/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Course>(`/courses/${id}/withdraw`, { method: "POST" }),
    remove: (id: string) => unwrap<void>(`/courses/${id}`, { method: "DELETE" }),
  },

  /**
   * Bài viết biên tập. Giảng viên chỉ thấy và sửa được bài của chính mình — ràng buộc
   * đó do learning-service áp, không phải do giao diện này ẩn nút đi.
   */
  articles: {
    mine: (params: { q?: string; status?: string; limit?: number; cursor?: string } = {}) =>
      unwrap<Page<ArticleListItem>>(`/articles/manage${query(params)}`),
    detail: (id: string) => unwrap<Article>(`/articles/manage/${id}`),
    create: (body: { title: string; slug?: string }) =>
      unwrap<Article>("/articles", { method: "POST", body }),
    update: (
      id: string,
      body: {
        title?: string;
        excerpt?: string;
        takeaway?: string;
        readMinutes?: number;
        tagId?: string;
      },
    ) => unwrap<Article>(`/articles/${id}`, { method: "PATCH", body }),
    saveContent: (id: string, contentHtml: string) =>
      unwrap<Article>(`/articles/${id}/content`, { method: "PUT", body: { contentHtml } }),
    submit: (id: string) => unwrap<Article>(`/articles/${id}/submit`, { method: "POST" }),
    withdraw: (id: string) => unwrap<Article>(`/articles/${id}/withdraw`, { method: "POST" }),
  },

  /**
   * Từ vựng chủ đề, do core-service sở hữu.
   *
   * Không nhầm với `GET /articles/tags`: đường đó chỉ trả chủ đề đã có bài công khai, nên
   * dùng để chọn lúc soạn thì bài đầu tiên của một chủ đề mới sẽ không bao giờ gắn được.
   */
  tags: {
    list: () => unwrap<Tag[]>("/tags"),
  },

  /**
   * Thông báo. Cùng API mà ứng dụng người học đọc — notification-service lọc theo đối
   * tượng nhận từ token, nên giảng viên chỉ thấy thông báo gửi cho mình hoặc cho tất cả.
   */
  notifications: {
    list: (params: { limit: number; before?: string }) =>
      unwrap<{ items: UiNotification[]; nextCursor: string | null }>(
        `/notifications?limit=${params.limit}${params.before ? `&before=${encodeURIComponent(params.before)}` : ""}&${NOTIFICATION_SCOPE}`,
      ),
    unreadCount: () => unwrap<{ count: number }>(`/notifications/unread-count?${NOTIFICATION_SCOPE}`),
    markRead: (id: string) => unwrap<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      unwrap<{ marked: number }>(`/notifications/read-all?${NOTIFICATION_SCOPE}`, { method: "PATCH" }),
  },
};

/**
 * Những loại thông báo có nghĩa với giảng viên: quyết định trên bài của chính họ, và
 * thông báo hệ thống. KHÔNG bao gồm "khoá học/bài viết mới ra mắt" — những sự kiện đó
 * gửi `audienceType: ALL` cho mọi người đã đăng nhập, kể cả giảng viên, nhưng chúng dành
 * cho người học chứ không phải cho tác giả của chính nội dung đó.
 */
const NOTIFICATION_SCOPE =
  "types=CONTENT_APPROVED,CONTENT_CHANGES_REQUESTED,CONTENT_REJECTED,ADMIN_ANNOUNCEMENT";
