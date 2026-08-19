import type { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";
import type { UiNotification } from "@codementor/ui";
import { KINDS } from "@/features/moderation/types";
import type { ContentKind, ModerationDecision, QueueItem } from "@/features/moderation/types";

/**
 * Hàng chờ duyệt. Bốn loại nội dung, bốn service, bốn đường dẫn — không có endpoint gộp
 * ở backend, vì một endpoint như thế buộc một service đọc bảng của service khác. Bảng
 * đường dẫn nằm ở `features/moderation/types.ts`, cạnh chỗ hiển thị chúng.
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Hàm gọi do `useAdminApi()` trả về. Mọi lời gọi đi qua `/api/backend`, nơi BFF gắn
 * access token phía server — trình duyệt không bao giờ cầm nó.
 *
 * Lấy kiểu từ chính `createApiClient` thay vì tự khai lại: khai lại thì hai bên trôi
 * khỏi nhau mà không ai báo.
 */
type Request = ReturnType<typeof createApiClient>;

async function unwrap<T>(request: Request, path: string, options?: Parameters<Request>[1]) {
  const response = await request<ApiResponse<T> | undefined>(path, options);
  // 204 No Content — mọi lệnh DELETE trả về thế này. Không có thân thì không có `data` để
  // bóc, và đọc `.data` của `undefined` là chỗ "can't access property data" nổ ra ngay khi
  // xoá thành công: bản ghi đã mất rồi mà màn hình vẫn báo lỗi.
  return response?.data as T;
}

export const moderationApi = {
  queue: (request: Request, kind: ContentKind) =>
    unwrap<Page<QueueItem>>(request, `${KINDS[kind].queuePath}?limit=50`),
  /** Bản đầy đủ, để xem trước trước khi quyết. */
  detail: <T,>(request: Request, kind: ContentKind, id: string) =>
    unwrap<T>(request, KINDS[kind].detailPath(id)),
  decide: (
    request: Request,
    kind: ContentKind,
    id: string,
    decision: ModerationDecision,
    reason?: string,
  ) =>
    unwrap<QueueItem>(request, KINDS[kind].moderatePath(id), {
      method: "POST",
      body: { decision, ...(reason ? { reason } : {}) },
    }),
  /**
   * Thân bài lý thuyết của một bài học, để xem trước bên trong hàng chờ duyệt khoá học.
   *
   * Cùng endpoint mà studio giảng viên dùng (`GET /courses/:id/lessons/:lessonId/content`)
   * — nó không giới hạn `@Roles`, quyền đọc nằm ở use case (`get()` cho phép admin đọc
   * mọi khoá học bất kể trạng thái), nên không cần đường riêng cho admin.
   */
  lessonContent: (request: Request, courseId: string, lessonId: string) =>
    unwrap<{ summary?: string; contentHtml?: string } | null>(
      request,
      `/courses/${courseId}/lessons/${lessonId}/content`,
    ),
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

/** Bộ đếm dẫn xuất từ bài nộp. `null` khi tài khoản chưa giải bài nào. */
export interface AdminUserStats {
  xp: number;
  solvedCount: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastSolvedOn: string | null;
}

/** Khảo sát định hướng, làm một lần lúc mới vào. */
export interface AdminUserPreferences {
  learningGoal: string | null;
  careerGoal: string | null;
  currentLevel: string | null;
  weeklyStudyHours: number | null;
  interestedFields: string[];
  completedAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  bio: string | null;
  websiteUrl: string | null;
  githubHandle: string | null;
  locale: string;
  timezone: string;
  emailVerifiedAt: string | null;
  stats: AdminUserStats | null;
  preferences: AdminUserPreferences | null;
}

/** Một việc người học đã làm. Xem `UserActivityUseCases` bên learning-service. */
export interface ActivityEntry {
  kind:
    | "roadmap_enrolled"
    | "course_enrolled"
    | "course_completed"
    | "lesson_completed"
    | "exercise_solved";
  title: string;
  detail: string | null;
  occurredAt: string;
}

/** Một dòng nhật ký kiểm toán. Chỉ ghi thêm, không bao giờ sửa. */
export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Một lần đăng nhập, đăng xuất hoặc đăng nhập hỏng, từ Keycloak. */
export interface LoginEvent {
  type: string;
  occurredAt: string;
  ipAddress: string | null;
  clientId: string | null;
  error: string | null;
}

/**
 * Vai trò như KEYCLOAK gọi. Khác với `role` trong danh sách (`learner`/`lecturer`/`admin`),
 * là giá trị enum trong Postgres.
 *
 * Hai bộ từ vựng cho cùng một khái niệm, và không bộ nào sai: Keycloak sở hữu việc gán
 * vai trò, Postgres sở hữu hồ sơ. Gửi nhầm chỉ nhận 400, nhưng đọc code mà không biết có
 * hai bộ thì rất dễ gửi nhầm — nên tên kiểu nói thẳng ra.
 */
export type KeycloakRole = "STUDENT" | "LECTURER" | "ADMIN";

/** Đổi vai trò của một hàng trong danh sách sang từ vựng Keycloak. */
export const KEYCLOAK_ROLE_OF: Record<string, KeycloakRole> = {
  learner: "STUDENT",
  lecturer: "LECTURER",
  admin: "ADMIN",
};

/** Tài khoản như Keycloak trả về sau khi tạo hoặc sửa. */
export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  enabled: boolean;
  roles: KeycloakRole[];
}

export const usersApi = {
  list: (request: Request, query: UsersQuery = {}) =>
    unwrap<Page<AdminUser>>(request, `/users${search(query)}`),
  summary: (request: Request) =>
    unwrap<{ total: number; byRole: Record<string, number> }>(request, "/users/summary"),
  growth: (request: Request) =>
    unwrap<{ month: string; newUsers: number; total: number }[]>(request, "/users/growth"),
  detail: (request: Request, id: string) => unwrap<AdminUserDetail>(request, `/users/${id}`),

  // Ba đường dưới đây đều nhận `users.id`, không phải id Keycloak — kể cả lịch sử đăng
  // nhập, dù dữ liệu gốc nằm ở Keycloak. Một hệ định danh duy nhất ở mặt API; backend tự
  // tra `external_id`. Hai bên đều là uuid nên gửi nhầm sẽ không báo lỗi, chỉ ra rỗng.
  loginHistory: (request: Request, id: string) =>
    unwrap<LoginEvent[]>(request, `/users/${id}/login-history`),
  auditTrail: (request: Request, id: string) =>
    unwrap<AuditLogEntry[]>(request, `/audit-logs${search({ targetType: "user", targetId: id })}`),
  /** Nhật ký kiểm toán gần đây, mọi đối tượng — cho bảng "Hoạt động gần đây". */
  recentAudit: (request: Request, limit = 8) =>
    unwrap<AuditLogEntry[]>(request, `/audit-logs${search({ limit })}`),
  activity: (request: Request, id: string) =>
    unwrap<ActivityEntry[]>(request, `/activity/users/${id}`),

  // ------------------------------------------------------------------ ghi
  //
  // CHÚ Ý: ba hàm dưới đây nhận `externalId` (id Keycloak), KHÁC với các hàm đọc ở trên
  // vốn nhận `users.id`. Không gộp được: chúng thao tác thẳng trên Keycloak, nơi không
  // biết gì về `users.id`. Tên tham số nói rõ để không phải nhớ.
  //
  // Không có hàm xoá, và đó là chủ ý — xem `0002_identity.sql`: tài khoản ngừng dùng đặt
  // `status = 'deleted'`, không xoá vật lý, để bài viết và bài nộp họ từng tạo vẫn còn
  // tác giả hợp lệ. "Xoá" ở giao diện quản trị nghĩa là tạm khoá.
  create: (
    request: Request,
    body: { email: string; displayName: string; role: KeycloakRole; password: string },
  ) => unwrap<ManagedUser>(request, "/users", { method: "POST", body }),

  setRole: (request: Request, externalId: string, role: KeycloakRole) =>
    unwrap<ManagedUser>(request, `/users/${externalId}/role`, { method: "PATCH", body: { role } }),

  setStatus: (request: Request, externalId: string, status: "ACTIVE" | "SUSPENDED") =>
    unwrap<ManagedUser>(request, `/users/${externalId}/status`, {
      method: "PATCH",
      body: { status },
    }),
};

/* ----------------------------------------------------- Course/Roadmap/Exercise */

/** Lọc dùng chung cho ba trang quản lý — cùng hình dạng query mà `/admin` của mỗi
 * service chấp nhận (xem `ListCoursesQueryDto` và tương đương ở roadmap/exercise). */
export interface AdminContentQuery extends Record<string, string | number | undefined> {
  q?: string;
  status?: string;
  authorId?: string;
  updatedFrom?: string;
  updatedTo?: string;
  limit?: number;
  cursor?: string;
}

export interface AdminCourseListItem {
  id: string;
  slug: string;
  title: string;
  level: string;
  status: string;
  durationHours: number | null;
  totalChapters: number;
  totalLessons: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export const coursesApi = {
  list: (request: Request, query: AdminContentQuery & { level?: string } = {}) =>
    unwrap<Page<AdminCourseListItem>>(request, `/courses/admin${search(query)}`),
  update: (
    request: Request,
    id: string,
    body: { title?: string; description?: string | null; level?: string },
  ) => unwrap<unknown>(request, `/courses/${id}`, { method: "PATCH", body }),
  remove: (request: Request, id: string) =>
    unwrap<void>(request, `/courses/${id}`, { method: "DELETE" }),
};

export interface AdminRoadmapListItem {
  id: string;
  slug: string;
  title: string;
  field: string;
  level: string;
  status: string;
  estimatedHours: number | null;
  courseCount: number;
  createdBy: string | null;
  authorName: string | null;
  updatedAt: string;
}

export const roadmapsApi = {
  list: (request: Request, query: AdminContentQuery & { field?: string; level?: string } = {}) =>
    unwrap<Page<AdminRoadmapListItem>>(request, `/roadmaps/admin${search(query)}`),
  update: (
    request: Request,
    id: string,
    body: { title?: string; description?: string | null; field?: string; level?: string },
  ) => unwrap<unknown>(request, `/roadmaps/${id}`, { method: "PATCH", body }),
  remove: (request: Request, id: string) =>
    unwrap<void>(request, `/roadmaps/${id}`, { method: "DELETE" }),
};

export interface AdminExerciseListItem {
  id: string;
  slug: string;
  title: string;
  kind: string;
  difficulty: string;
  status: string;
  visibility: string;
  authorId: string | null;
  authorName: string | null;
  forkedFromId: string | null;
  updatedAt: string;
}

export const exercisesApi = {
  list: (request: Request, query: AdminContentQuery & { kind?: string; difficulty?: string } = {}) =>
    unwrap<Page<AdminExerciseListItem>>(request, `/exercises/admin${search(query)}`),
  update: (
    request: Request,
    id: string,
    body: { title?: string; summary?: string | null; difficulty?: string },
  ) => unwrap<unknown>(request, `/exercises/${id}`, { method: "PATCH", body }),
  remove: (request: Request, id: string) =>
    unwrap<void>(request, `/exercises/${id}`, { method: "DELETE" }),
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
    body: {
      title?: string;
      slug?: string;
      excerpt?: string;
      takeaway?: string;
      readMinutes?: number;
      tagId?: string;
    },
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

/** Chủ đề dùng chung cho bài viết và bài tập, do core-service sở hữu. */
export interface Tag {
  id: string;
  slug: string;
  name: string;
}

/**
 * Không nhầm với `GET /articles/tags` bên learning-service: đường đó chỉ trả chủ đề đã có
 * bài công khai, nên bài đầu tiên của một chủ đề mới sẽ không bao giờ gắn được chủ đề đó.
 */
export const tagsApi = {
  list: (request: Request) => unwrap<Tag[]>(request, "/tags"),
};

/* ----------------------------------------------------------- Thông báo */

/**
 * Cùng API mà hai ứng dụng kia đọc. notification-service lọc theo đối tượng nhận lấy từ
 * token, nên quản trị viên thấy thông báo gửi cho vai trò `admin` và thông báo chung —
 * không phải hộp thư của tất cả mọi người.
 */
/**
 * Những loại thông báo có nghĩa với quản trị viên: nội dung đang chờ họ duyệt, và thông
 * báo hệ thống. KHÔNG bao gồm "khoá học/bài viết mới ra mắt" — những sự kiện đó gửi
 * `audienceType: ALL` cho mọi người đã đăng nhập, kể cả admin, nhưng chúng dành cho người
 * học chứ không phải cho người vận hành nền tảng.
 */
const NOTIFICATION_TYPES = ["CONTENT_REVIEW_REQUESTED", "ADMIN_ANNOUNCEMENT"];

export const notificationsApi = {
  list: (request: Request, params: { limit: number; before?: string }) =>
    unwrap<{ items: UiNotification[]; nextCursor: string | null }>(
      request,
      `/notifications${search({
        limit: params.limit,
        before: params.before,
        types: NOTIFICATION_TYPES.join(","),
      })}`,
    ),
  unreadCount: (request: Request) =>
    unwrap<{ count: number }>(
      request,
      `/notifications/unread-count${search({ types: NOTIFICATION_TYPES.join(",") })}`,
    ),
  markRead: (request: Request, id: string) =>
    unwrap<void>(request, `/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: (request: Request) =>
    unwrap<{ marked: number }>(
      request,
      `/notifications/read-all${search({ types: NOTIFICATION_TYPES.join(",") })}`,
      { method: "PATCH" },
    ),
};
