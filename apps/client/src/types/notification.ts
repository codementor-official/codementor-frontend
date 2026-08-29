/** Đúng hình dạng notification-service trả về, và cũng là payload đẩy qua WebSocket. */
export type NotificationType =
  | "COURSE_PUBLISHED"
  | "EXERCISE_PUBLISHED"
  | "ROADMAP_PUBLISHED"
  | "ARTICLE_PUBLISHED"
  | "ADMIN_ANNOUNCEMENT"
  | "CONTENT_REVIEW_REQUESTED"
  | "CONTENT_REMOVAL_REQUESTED"
  | "CONTENT_APPROVED"
  | "CONTENT_CHANGES_REQUESTED"
  | "CONTENT_REJECTED"
  | "CONTENT_ARCHIVED"
  | "REMOVAL_REQUEST_DENIED"
  | "WORKSPACE_JOIN_APPROVED"
  | "WORKSPACE_JOIN_REJECTED"
  | "WORKSPACE_ASSIGNMENT_CREATED"
  | "WORKSPACE_ASSIGNMENT_DUE_SOON"
  | "WORKSPACE_ASSIGNMENT_OVERDUE"
  | "WORKSPACE_ASSIGNMENT_REVIEWED"
  | "WORKSPACE_MESSAGE";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  /**
   * Nhãn và đường dẫn của nút hành động do SERVER quyết định.
   *
   * Cố tình không dựng URL ở client theo `type`: làm vậy thì mỗi khi thêm một loại thông
   * báo lại phải sửa frontend, và quy tắc điều hướng sẽ nằm rải ở cả hai phía. Xem
   * `notification-content.ts` bên notification-service — toàn bộ ánh xạ ở đúng một chỗ.
   */
  actionLabel: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export interface NotificationPage {
  items: AppNotification[];
  nextCursor: string | null;
}
