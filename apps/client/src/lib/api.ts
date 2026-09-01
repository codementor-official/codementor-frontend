import { createApiClient } from "@codementor/api-client";
import type { ApiResponse } from "@codementor/types";
import type {
  JudgeRunPayload,
  JudgeRunResult,
  JudgeSpecPayload,
} from "@codementor/solve";
import { apiBaseUrl } from "@/lib/env";
import type { NotificationPage } from "@/types/notification";
import type { RecommendationList } from "@/types/recommendation";
import type {
  WorkspaceDetail,
  PublicWorkspaceDetail,
  WorkspaceMembersPage,
  WorkspaceAssignment,
  WorkspaceContentPage,
  WorkspaceDocument,
  WorkspaceExercise,
  WorkspaceExerciseDetail,
  WorkspaceSubmission,
  WorkspaceMemberDetail,
  WorkspaceJoinRequest,
  WorkspaceOverview,
  WorkspacePage,
  WorkspacePermission,
  WorkspaceRole,
  WorkspaceSummary,
  WorkspaceUploadConfig,
  PresignedWorkspaceUpload,
  WorkspaceMessage,
  WorkspaceMessagePage,
} from "@/features/workspace/types";
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
  RoadmapEnrollment,
  EnrolledRoadmap,
  RoadmapProgress,
  RoadmapSummary,
} from "@/types/catalogue";
import type {
  AccountProfile,
  BookmarkPage,
  BookmarkTarget,
  ContentReport,
  ReportCategory,
  ReportTarget,
  PresignedAvatarUpload,
  UserActivityEntry,
  UserLearningPreferences,
  UserActivityCalendar,
  UserLearningStats,
  LearningLeaderboardEntry,
  UserSettings,
} from "@/features/account/types";

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
const direct = createApiClient({
  baseUrl: apiBaseUrl,
  getAccessToken: () => readAccessToken(),
});

/**
 * Phiên đăng nhập bằng mật khẩu: token nằm trong cookie HttpOnly nên trình duyệt không
 * gắn `Authorization` được. Proxy cùng origin ở `/api/backend` gắn hộ phía server.
 */
const viaBff = createApiClient({ baseUrl: "/api/backend" });

function request<T>(
  path: string,
  options?: Parameters<typeof direct>[1],
): Promise<T> {
  return readAccessToken()
    ? direct<T>(path, options)
    : viaBff<T>(path, options);
}

/** Every backend response is wrapped by the response interceptor in libs/platform. */
async function unwrap<T>(
  path: string,
  options?: Parameters<typeof request>[1],
): Promise<T> {
  const response = await request<ApiResponse<T> | undefined>(path, options);
  // 204 No Content — mọi lệnh DELETE trả về thế này. Không có thân thì không có `data` để
  // bóc, và đọc `.data` của `undefined` là chỗ "can't access property data" nổ ra ngay khi
  // xoá thành công: bản ghi đã mất rồi mà màn hình vẫn báo lỗi.
  return response?.data as T;
}

function query(
  params: CatalogueParams | Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export const api = {
  me: () => unwrap<AccountProfile>("/me"),
  account: {
    updateProfile: (body: Partial<Pick<AccountProfile, "displayName" | "handle" | "bio" | "avatarUrl" | "websiteUrl" | "githubHandle" | "locale" | "timezone">>) =>
      unwrap<AccountProfile>("/me", { method: "PATCH", body }),
    avatarUploadUrl: (body: { filename: string; contentType: string; sizeBytes: number }) =>
      unwrap<PresignedAvatarUpload>("/me/avatar/upload-url", { method: "POST", body }),
    settings: () => unwrap<UserSettings>("/me/settings"),
    updateSettings: (body: Partial<UserSettings>) =>
      unwrap<UserSettings>("/me/settings", { method: "PATCH", body }),
    resetSettings: () => unwrap<UserSettings>("/me/settings", { method: "DELETE" }),
    preferences: () => unwrap<UserLearningPreferences>("/me/preferences"),
    updatePreferences: (body: Partial<Omit<UserLearningPreferences, "completedAt">>) =>
      unwrap<UserLearningPreferences>("/me/preferences", { method: "PATCH", body }),
    stats: () => unwrap<UserLearningStats>("/me/stats"),
    leaderboard: (limit = 5) =>
      unwrap<LearningLeaderboardEntry[]>(`/users/leaderboard${query({ limit })}`),
    activityCalendar: (weeks = 13) =>
      unwrap<UserActivityCalendar>(`/activity/me/calendar${query({ weeks })}`),
    recentActivity: (limit = 10) =>
      unwrap<UserActivityEntry[]>(`/activity/me${query({ limit })}`),
    bookmarks: (params: { type?: BookmarkTarget; page?: number; limit?: number } = {}) =>
      unwrap<BookmarkPage>(`/me/bookmarks${query(params)}`),
    saveBookmark: (body: { targetType: BookmarkTarget; targetId: string; targetRef?: string }) =>
      unwrap<BookmarkPage["items"][number]>("/me/bookmarks", { method: "POST", body }),
    removeBookmark: (targetType: BookmarkTarget, targetId: string) =>
      unwrap<{ removed: true }>(`/me/bookmarks/${targetType}/${targetId}`, { method: "DELETE" }),
    submitReport: (body: {
      targetType: ReportTarget;
      targetId: string;
      targetRef?: string;
      category: ReportCategory;
      note?: string;
    }) => unwrap<ContentReport>("/me/reports", { method: "POST", body }),
  },

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
    mine: () => unwrap<EnrolledRoadmap[]>("/roadmaps/enrollments/mine"),
    enroll: (id: string) =>
      unwrap<RoadmapEnrollment>(`/roadmaps/${id}/enroll`, { method: "POST" }),
    unenroll: (id: string) =>
      unwrap<void>(`/roadmaps/${id}/enroll`, { method: "DELETE" }),
    progress: (id: string) => unwrap<RoadmapProgress>(`/roadmaps/${id}/progress`),
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
    unenroll: (id: string) =>
      unwrap<void>(`/courses/${id}/enroll`, { method: "DELETE" }),

    lessonContent: (courseId: string, lessonId: string) =>
      unwrap<LessonContent | null>(
        `/courses/${courseId}/lessons/${lessonId}/content`,
      ),

    /** Works before enrolling too — `enrollment` is null and the lessons still come back. */
    progress: (id: string) => unwrap<CourseProgress>(`/courses/${id}/progress`),

    /**
     * `timeSpentSeconds` is this session only; the server adds it to the running total.
     * Sending a cumulative figure would double-count on every save.
     */
    recordProgress: (
      courseId: string,
      lessonId: string,
      body: {
        status: ProgressStatus;
        timeSpentSeconds?: number;
        lastPositionSeconds?: number | null;
      },
    ) =>
      unwrap<LessonProgress>(
        `/courses/${courseId}/lessons/${lessonId}/progress`,
        {
          method: "PUT",
          body,
        },
      ),
  },
  exercises: {
    bank: (params: CatalogueParams = {}) =>
      unwrap<Page<ExerciseSummary>>(`/exercises${query(params)}`),
    /** Takes the UUID, not the slug — the service has no slug lookup. */
    detail: (id: string) => unwrap<ExerciseDetail>(`/exercises/${id}`),
  },

  /**
   * Đề xuất theo hồ sơ học tập. `userId` luôn lấy từ token — không route nào ở đây nhận id
   * người dùng, nên không có gì để truyền vào. Cờ tắt/bật gợi ý thích ứng do service đọc
   * lấy: khi tắt, `personalized` về `false` và danh sách là bảng phổ biến chung.
   */
  recommendations: {
    roadmaps: (limit = 6) =>
      unwrap<RecommendationList>(`/recommendations/roadmaps${query({ limit })}`),
    courses: (limit = 6) =>
      unwrap<RecommendationList>(`/recommendations/courses${query({ limit })}`),
    exercises: (limit = 6) =>
      unwrap<RecommendationList>(`/recommendations/exercises${query({ limit })}`),
    articles: (limit = 6) =>
      unwrap<RecommendationList>(`/recommendations/articles${query({ limit })}`),
    /** Chỉ nhóm CÔNG KHAI và đang hoạt động; nhóm đã tham gia bị service loại sẵn. */
    groups: (limit = 6) =>
      unwrap<RecommendationList>(`/recommendations/groups${query({ limit })}`),
    /** Một bài kế tiếp sau khi vừa nộp đạt — trả về cùng dạng danh sách, nhiều nhất 1 mục. */
    nextExercise: (exerciseId: string) =>
      unwrap<RecommendationList>(`/recommendations/exercises/next${query({ exerciseId })}`),
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
    markAllRead: () =>
      unwrap<{ marked: number }>("/notifications/read-all", {
        method: "PATCH",
      }),
  },

  workspaces: {
    messages: (
      slug: string,
      params: { before?: string; limit?: number } = {},
    ) =>
      unwrap<WorkspaceMessagePage>(
        `/workspaces/${encodeURIComponent(slug)}/messages${query(params)}`,
      ),
    unreadMessages: (slug: string) =>
      unwrap<{ count: number }>(
        `/workspaces/${encodeURIComponent(slug)}/messages/unread`,
      ),
    createMessage: (slug: string, content: string) =>
      unwrap<WorkspaceMessage>(
        `/workspaces/${encodeURIComponent(slug)}/messages`,
        { method: "POST", body: { content } },
      ),
    updateMessage: (slug: string, messageId: string, content: string) =>
      unwrap<WorkspaceMessage>(
        `/workspaces/${encodeURIComponent(slug)}/messages/${encodeURIComponent(messageId)}`,
        { method: "PATCH", body: { content } },
      ),
    deleteMessage: (slug: string, messageId: string) =>
      unwrap<WorkspaceMessage>(
        `/workspaces/${encodeURIComponent(slug)}/messages/${encodeURIComponent(messageId)}`,
        { method: "DELETE" },
      ),
    markMessagesRead: (slug: string) =>
      unwrap<{ readAt: string }>(
        `/workspaces/${encodeURIComponent(slug)}/messages/read`,
        { method: "POST" },
      ),
    list: (
      params: {
        scope?: "all" | "mine" | "owned" | "joined" | "discover";
        q?: string;
        topic?: string;
        page?: number;
        limit?: number;
      } = {},
    ) => unwrap<WorkspacePage>(`/workspaces${query(params)}`),
    summary: () => unwrap<WorkspaceSummary>("/workspaces/summary"),
    detail: (slug: string) =>
      unwrap<WorkspaceDetail>(`/workspaces/${encodeURIComponent(slug)}`),
    publicDetail: (slug: string) =>
      unwrap<PublicWorkspaceDetail>(`/workspaces/${encodeURIComponent(slug)}/public`),
    overview: (
      slug: string,
      params: {
        activitySearch?: string;
        activityPage?: number;
        activityLimit?: number;
      } = {},
    ) =>
      unwrap<WorkspaceOverview>(
        `/workspaces/${encodeURIComponent(slug)}/overview${query(params)}`,
      ),
    documents: (
      slug: string,
      params: {
        page?: number;
        limit?: number;
        q?: string;
        status?: string;
        type?: string;
      } = {},
    ) =>
      unwrap<WorkspaceContentPage<WorkspaceDocument>>(
        `/workspaces/${encodeURIComponent(slug)}/documents${query(params)}`,
      ),
    documentUploadConfig: (slug: string) =>
      unwrap<WorkspaceUploadConfig>(
        `/workspaces/${encodeURIComponent(slug)}/documents/upload-config`,
      ),
    documentUploadUrl: (
      slug: string,
      body: { filename: string; contentType: string; sizeBytes: number },
    ) =>
      unwrap<PresignedWorkspaceUpload>(
        `/workspaces/${encodeURIComponent(slug)}/documents/upload-url`,
        { method: "POST", body },
      ),
    createDocument: (
      slug: string,
      body: {
        filename: string;
        contentType: string;
        sizeBytes: number;
        title: string;
        docType: string;
        topic?: string;
        storageKey: string;
        url: string;
      },
    ) =>
      unwrap<WorkspaceDocument>(
        `/workspaces/${encodeURIComponent(slug)}/documents`,
        { method: "POST", body },
      ),
    updateDocument: (
      slug: string,
      id: string,
      body: { title?: string; topic?: string | null; status?: string },
    ) =>
      unwrap<WorkspaceDocument>(
        `/workspaces/${encodeURIComponent(slug)}/documents/${id}`,
        { method: "PATCH", body },
      ),
    deleteDocument: (slug: string, id: string) =>
      unwrap<void>(`/workspaces/${encodeURIComponent(slug)}/documents/${id}`, {
        method: "DELETE",
      }),
    pendingDocumentCount: (slug: string) =>
      unwrap<{ count: number }>(
        `/workspaces/${encodeURIComponent(slug)}/documents/pending-count`,
      ),
    restoreDocument: (slug: string, id: string) =>
      unwrap<{ restored: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/documents/${id}/restore`,
        { method: "POST" },
      ),
    purgeDocument: (slug: string, id: string) =>
      unwrap<void>(
        `/workspaces/${encodeURIComponent(slug)}/documents/${id}/permanent`,
        { method: "DELETE" },
      ),
    reportDocument: (
      slug: string,
      id: string,
      body: { category: string; note?: string },
    ) =>
      unwrap<{ id: string; status: string; createdAt: string }>(
        `/workspaces/${encodeURIComponent(slug)}/documents/${id}/reports`,
        { method: "POST", body },
      ),
    documentDownload: (slug: string, id: string, preview = false) =>
      unwrap<{ url: string | null; expiresInSeconds: number | null }>(
        `/workspaces/${encodeURIComponent(slug)}/documents/${id}/download${preview ? "?preview=1" : ""}`,
      ),
    assetUploadUrl: (
      slug: string,
      body: {
        filename: string;
        contentType: string;
        sizeBytes: number;
        kind: "cover";
      },
    ) =>
      unwrap<PresignedWorkspaceUpload>(
        `/workspaces/${encodeURIComponent(slug)}/assets/upload-url`,
        { method: "POST", body },
      ),
    coverPreview: (slug: string) =>
      unwrap<{ url: string | null; expiresInSeconds: number | null }>(
        `/workspaces/${encodeURIComponent(slug)}/assets/cover`,
      ),
    workspaceExercises: (
      slug: string,
      params: {
        page?: number;
        limit?: number;
        q?: string;
        status?: string;
        difficulty?: string;
        scope?: "all" | "assigned" | "public";
      } = {},
    ) =>
      unwrap<WorkspaceContentPage<WorkspaceExercise>>(
        `/workspaces/${encodeURIComponent(slug)}/exercises${query(params)}`,
      ),
    attachExercise: (
      slug: string,
      body: {
        exerciseId: string;
        dueAt?: string;
        attemptLimit?: number;
        allowRetry?: boolean;
        allowLateSubmission?: boolean;
        memberIds: string[];
      },
    ) =>
      unwrap<{ attached: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/attach`,
        { method: "POST", body },
      ),
    createWorkspaceExercise: (
      slug: string,
      body: {
        slug?: string;
        title: string;
        summary?: string;
        difficulty: "easy" | "medium" | "hard";
        source?: "manual" | "ai";
        xpReward?: number;
        estimatedMinutes?: number | null;
        timeLimitMs?: number;
        memoryLimitKb?: number;
        content: Record<string, unknown>;
        dueAt?: string;
        attemptLimit?: number;
        allowRetry?: boolean;
        allowLateSubmission?: boolean;
        memberIds: string[];
      },
    ) =>
      unwrap<WorkspaceExercise>(
        `/workspaces/${encodeURIComponent(slug)}/exercises`,
        { method: "POST", body },
      ),
    generateWorkspaceExerciseDraft: (
      slug: string,
      body: {
        prompt: string;
        documentIds?: string[];
        difficulty?: "easy" | "medium" | "hard";
      },
    ) =>
      unwrap<{
        title: string;
        summary: string;
        difficulty: "easy" | "medium" | "hard";
        source: "ai";
        content: Record<string, unknown>;
        sourceDocuments: Array<{ id: string; title: string }>;
      }>(`/workspaces/${encodeURIComponent(slug)}/exercises/generate-draft`, {
        method: "POST",
        body,
      }),
    duplicateWorkspaceExercise: (slug: string, id: string) =>
      unwrap<WorkspaceExercise>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/${id}/duplicate`,
        { method: "POST" },
      ),
    updateWorkspaceExercise: (
      slug: string,
      id: string,
      body: {
        dueAt?: string | null;
        attemptLimit?: number | null;
        allowRetry?: boolean;
        allowLateSubmission?: boolean;
        memberIds?: string[];
        title?: string;
        estimatedMinutes?: number | null;
        timeLimitMs?: number;
        memoryLimitKb?: number;
        summary?: string | null;
        difficulty?: "easy" | "medium" | "hard";
        publicationStatus?: "published" | "hidden";
        content?: Record<string, unknown>;
      },
    ) =>
      unwrap<{ updated: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/${id}`,
        { method: "PATCH", body },
      ),
    deleteWorkspaceExercise: (slug: string, id: string) =>
      unwrap<void>(`/workspaces/${encodeURIComponent(slug)}/exercises/${id}`, {
        method: "DELETE",
      }),
    restoreWorkspaceExercise: (slug: string, id: string) =>
      unwrap<{ restored: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/${id}/restore`,
        { method: "POST" },
      ),
    purgeWorkspaceExercise: (slug: string, id: string) =>
      unwrap<void>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/${id}/permanent`,
        { method: "DELETE" },
      ),
    workspaceExerciseDetail: (slug: string, id: string) =>
      unwrap<WorkspaceExerciseDetail>(
        `/workspaces/${encodeURIComponent(slug)}/exercises/${id}/detail`,
      ),
    assignments: (
      slug: string,
      params: {
        page?: number;
        limit?: number;
        q?: string;
        status?: string;
        groupExerciseId?: string;
      } = {},
    ) =>
      unwrap<WorkspaceContentPage<WorkspaceAssignment>>(
        `/workspaces/${encodeURIComponent(slug)}/assignments${query(params)}`,
      ),
    updateAssignment: (
      slug: string,
      id: string,
      body: {
        status?: string;
        reviewStatus?: string;
        feedback?: string | null;
      },
    ) =>
      unwrap<{ updated: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/assignments/${id}`,
        { method: "PATCH", body },
      ),
    submissionHistory: (slug: string, id: string) =>
      unwrap<{ items: WorkspaceSubmission[]; canReview: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/assignments/${id}/submissions`,
      ),
    create: (body: { name: string; description?: string; topic?: string }) =>
      unwrap<WorkspaceDetail>("/workspaces", { method: "POST", body }),
    join: (inviteCode: string) =>
      unwrap<{
        status: "joined" | "pending";
        requestId?: string;
        workspaceSlug: string;
      }>("/workspaces/join", {
        method: "POST",
        body: { inviteCode },
      }),
    update: (
      slug: string,
      body: {
        name?: string;
        description?: string | null;
        topic?: string | null;
        privacy?: "public" | "private";
        joinPolicy?: "open" | "approval" | "invite_only";
        avatarUrl?: string | null;
        avatarKey?: string | null;
        coverUrl?: string | null;
        coverKey?: string | null;
        coverPosition?: "top" | "center" | "bottom";
        coverFit?: "cover" | "contain";
        coverHeight?: "compact" | "medium" | "tall";
      },
    ) =>
      unwrap<WorkspaceDetail>(`/workspaces/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body,
      }),
    archive: (slug: string) =>
      unwrap<{ archived: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/archive`,
        { method: "POST" },
      ),
    rotateInviteCode: (slug: string) =>
      unwrap<{ inviteCode: string }>(
        `/workspaces/${encodeURIComponent(slug)}/invite-code/rotate`,
        { method: "POST" },
      ),
    leave: (slug: string) =>
      unwrap<{ left: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/leave`,
        { method: "POST" },
      ),
    members: (
      slug: string,
      params: {
        search?: string;
        q?: string;
        role?: WorkspaceRole;
        page?: number;
        limit?: number;
        progress?: "not_started" | "in_progress" | "completed";
        activityLevel?: "low" | "medium" | "high";
        submissionStatus?: "not_submitted" | "submitted" | "passed";
        joinedFrom?: string;
        joinedTo?: string;
      } = {},
    ) =>
      unwrap<WorkspaceMembersPage>(
        `/workspaces/${encodeURIComponent(slug)}/members${query(params)}`,
      ),
    memberDetail: (slug: string, memberId: string) =>
      unwrap<WorkspaceMemberDetail>(
        `/workspaces/${encodeURIComponent(slug)}/members/${memberId}`,
      ),
    updateMemberPermissions: (
      slug: string,
      memberId: string,
      permissions: Partial<Record<WorkspacePermission, boolean | null>>,
    ) =>
      unwrap<WorkspaceMemberDetail>(
        `/workspaces/${encodeURIComponent(slug)}/members/${memberId}/permissions`,
        { method: "PUT", body: { permissions } },
      ),
    requestJoin: (slug: string, message?: string) =>
      unwrap<{ status: string; requestId?: string; workspaceSlug: string }>(
        `/workspaces/${encodeURIComponent(slug)}/join-request`,
        { method: "POST", body: { message } },
      ),
    joinRequests: (
      slug: string,
      status: "pending" | "rejected" | "all" = "pending",
    ) =>
      unwrap<{ items: WorkspaceJoinRequest[] }>(
        `/workspaces/${encodeURIComponent(slug)}/join-requests${query({ status })}`,
      ),
    reviewJoinRequest: (
      slug: string,
      requestId: string,
      decision: "approve" | "reject",
    ) =>
      unwrap<{ status: string }>(
        `/workspaces/${encodeURIComponent(slug)}/join-requests/${requestId}/${decision}`,
        { method: "POST" },
      ),
    invite: (slug: string, handle: string) =>
      unwrap<{
        invitationId: string;
        user: { id: string; displayName: string; avatarUrl: string | null };
      }>(`/workspaces/${encodeURIComponent(slug)}/invitations`, {
        method: "POST",
        body: { handle },
      }),
    invitations: (
      slug: string,
      params: {
        search?: string;
        q?: string;
        page?: number;
        limit?: number;
      } = {},
    ) =>
      unwrap<{
        items: Array<{
          id: string;
          user: { id: string; displayName: string; avatarUrl: string | null };
          role: WorkspaceRole;
          invitedAt: string;
        }>;
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(`/workspaces/${encodeURIComponent(slug)}/invitations${query(params)}`),
    acceptInvitation: (slug: string, invitationId: string) =>
      unwrap<WorkspaceDetail>(
        `/workspaces/${encodeURIComponent(slug)}/invitations/${invitationId}/accept`,
        { method: "POST" },
      ),
    revokeInvitation: (slug: string, invitationId: string) =>
      unwrap<void>(
        `/workspaces/${encodeURIComponent(slug)}/invitations/${invitationId}`,
        { method: "DELETE" },
      ),
    updateMemberRole: (
      slug: string,
      memberId: string,
      role: Exclude<WorkspaceRole, "owner">,
    ) =>
      unwrap<void>(
        `/workspaces/${encodeURIComponent(slug)}/members/${memberId}/role`,
        {
          method: "PATCH",
          body: { role },
        },
      ),
    removeMember: (slug: string, memberId: string) =>
      unwrap<void>(
        `/workspaces/${encodeURIComponent(slug)}/members/${memberId}`,
        { method: "DELETE" },
      ),
    transferOwnership: (slug: string, memberId: string) =>
      unwrap<{ transferred: boolean }>(
        `/workspaces/${encodeURIComponent(slug)}/transfer-ownership`,
        {
          method: "POST",
          body: { memberId },
        },
      ),
    updateRolePermissions: (
      slug: string,
      role: Exclude<WorkspaceRole, "owner">,
      permissions: Partial<Record<WorkspacePermission, boolean>>,
    ) =>
      unwrap<WorkspaceDetail>(
        `/workspaces/${encodeURIComponent(slug)}/permissions/roles/${role}`,
        {
          method: "PUT",
          body: { permissions },
        },
      ),
  },

  /**
   * judge-service chấm đồng bộ trong sandbox Docker. Đây là đường chạy thử: không tạo bài
   * nộp, không ghi lịch sử. Bài nộp thật sẽ đi qua submission-service và Kafka khi service
   * đó được viết.
   */
  judge: {
    run: (
      body: Omit<JudgeRunPayload, "spec"> & {
        spec?:
          | JudgeRunPayload["spec"]
          | {
              functionName: string;
              parameters: { name: string; type: Record<string, unknown> }[];
              returnType: Record<string, unknown>;
            };
        context?: { courseId: string; lessonId: string; exerciseId: string };
      },
    ) =>
      unwrap<JudgeRunResult>("/judge/run", {
        method: "POST",
        body: body as unknown as Record<string, unknown>,
      }),
    starter: (body: { languages: string[]; spec: JudgeSpecPayload }) =>
      unwrap<{
        starters: Record<string, string>;
        unsupported: Record<string, string>;
      }>("/judge/starter", { method: "POST", body }),
  },

  submissions: {
    create: (body: {
      exerciseId: string;
      assignmentId?: string;
      language: string;
      sourceCode: string;
      courseId?: string;
      lessonId?: string;
    }) =>
      unwrap<JudgeRunResult & {
        id: string;
        exerciseId: string;
        assignmentId: string | null;
        attemptNumber: number;
        submittedAt: string;
      }>("/submissions", { method: "POST", body }),
    mine: (params: { exerciseId?: string; page?: number; limit?: number } = {}) => {
      const search = new URLSearchParams();
      if (params.exerciseId) search.set("exerciseId", params.exerciseId);
      if (params.page) search.set("page", String(params.page));
      if (params.limit) search.set("limit", String(params.limit));
      return unwrap<{
        items: Array<{
          id: string;
          exerciseId: string;
          assignmentId: string | null;
          language: string;
          verdict: string;
          score: number | null;
          passedTests: number | null;
          totalTests: number | null;
          runtimeMs: number | null;
          memoryKb: number | null;
          attemptNumber: number;
          isLate: boolean;
          submittedAt: string;
        }>;
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>(`/submissions/mine${search.size ? `?${search}` : ""}`);
    },
  },
};
