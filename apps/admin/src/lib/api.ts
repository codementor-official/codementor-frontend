import type { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";
import type { Exercise, JudgeRunPayload, JudgeRunResult } from "@codementor/solve";

/**
 * Ba loại nội dung, ba service, ba đường dẫn — không có endpoint gộp ở backend, vì một
 * endpoint như thế buộc một service đọc bảng của service khác.
 */
export type ContentKind = "exercises" | "courses" | "roadmaps";

/**
 * Các trạng thái admin thao tác được. `draft` không có ở đây và đó là chủ ý: bản nháp là
 * việc riêng của tác giả, admin nhìn vào chỉ để lộ thứ chưa ai muốn cho xem.
 */
export const MODERATION_STATUSES = [
  "pending_review",
  "published",
  "changes_requested",
  "rejected",
  "archived",
] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
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

/**
 * Một dòng hàng chờ. Ba loại nội dung dùng chung kiểu này vì màn danh sách của chúng
 * giống nhau tới 90%; phần khác nhau là mấy trường tuỳ chọn bên dưới, và mỗi màn chỉ đọc
 * những trường loại đó thực sự có.
 */
export interface QueueItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  authorName: string | null;
  /** Do màn admin gắn thêm sau khi gộp ba hàng chờ; API không trả trường này. */
  kind?: ContentKind;

  /** Chỉ bài code. */
  difficulty?: string;
  visibility?: string;
  /** Khoá học và lộ trình. */
  level?: string;
  /** Chỉ lộ trình. */
  field?: string;
  courseCount?: number;
  estimatedHours?: number | null;
  /** Chỉ khoá học. */
  totalChapters?: number;
  totalLessons?: number;
  durationHours?: number | null;
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
  const response = await request<ApiResponse<T> | undefined>(path, options);
  // 204 No Content — mọi lệnh DELETE trả về thế này. Không có thân thì không có `data` để
  // bóc, và đọc `.data` của `undefined` là chỗ "can't access property data" nổ ra ngay khi
  // xoá thành công: bản ghi đã mất rồi mà màn hình vẫn báo lỗi.
  return response?.data as T;
}

/** Một bài học trong chương, phẳng như backend trả về. */
export interface CurriculumLesson {
  id: string;
  title: string;
  type: string;
  durationMinutes: number | null;
  isPreview: boolean;
  isOptional: boolean;
  position: number;
  contentRef: string | null;
  exerciseId: string | null;
  exerciseTitle: string | null;
  /** Bài code gắn vào chương mà chưa `published` thì học viên gặp một chương trống. */
  exerciseStatus: string | null;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description: string | null;
  isOptional: boolean;
  position: number;
  lessons: CurriculumLesson[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: string;
  durationHours: number | null;
  prerequisiteNote: string | null;
  progressionMode: string;
  status: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  totalChapters: number;
  totalLessons: number;
  updatedAt: string;
  chapters?: CurriculumChapter[];
}

/** Thân bài lý thuyết, ở MongoDB. `null` khi tác giả chưa viết gì. */
export interface LessonContent {
  summary?: string;
  objectives?: string[];
  contentHtml?: string;
  exerciseBrief?: string[];
}

export interface RoadmapCourse {
  courseId: string;
  position: number;
  isOptional: boolean;
  title: string;
  slug: string;
  status: string;
  durationHours: number | null;
}

export interface RoadmapDetail {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  field: string;
  level: string;
  coverImageUrl: string | null;
  estimatedHours: number | null;
  progressionMode: string;
  prerequisiteNote: string | null;
  status: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  updatedAt: string;
  courses?: RoadmapCourse[];
}

export const moderationApi = {
  /**
   * Hàng chờ duyệt, và cũng là đường tìm lại thứ đã quyết định rồi.
   *
   * Không truyền `status` thì backend trả đúng `pending_review` như trước. Truyền vào thì
   * nó bỏ ràng buộc đó — nhờ vậy admin mở lại được bài đã duyệt để gỡ, hoặc bài đã từ chối
   * để duyệt lại, thay vì phải nhờ tác giả gửi lên lần nữa.
   */
  queue: (
    request: Request,
    kind: ContentKind,
    params: { status?: string; q?: string; limit?: number } = {},
  ) => unwrap<Page<QueueItem>>(request, `/${kind}/moderation${search({ limit: 50, ...params })}`),
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

  // ----------------------------------------------------------------- xem nội dung
  //
  // Ba đường đọc chi tiết. Admin xem được mọi trạng thái — `owns()` bên backend coi admin
  // là chủ mọi bản ghi — nên không cần đường riêng cho kiểm duyệt.
  exercise: (request: Request, id: string) => unwrap<Exercise>(request, `/exercises/${id}`),
  course: (request: Request, id: string) => unwrap<CourseDetail>(request, `/courses/${id}`),
  roadmap: (request: Request, id: string) => unwrap<RoadmapDetail>(request, `/roadmaps/${id}`),
  lessonContent: (request: Request, courseId: string, lessonId: string) =>
    unwrap<LessonContent | null>(request, `/courses/${courseId}/lessons/${lessonId}/content`),

  /**
   * Chạy thử đề bằng chính judge chấm bài thật.
   *
   * Đây là thao tác kiểm duyệt quan trọng nhất với bài code và là thứ duy nhất không nhìn
   * bằng mắt được: một đề sai testcase trông y hệt một đề đúng cho tới lúc chạy nó.
   */
  judgeRun: (request: Request, body: JudgeRunPayload) =>
    unwrap<JudgeRunResult>(request, "/judge/run", { method: "POST", body: { ...body } }),
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
