/** Đúng hình dạng notification-service trả về, và cũng là payload đẩy qua WebSocket. */
export type NotificationType =
  | "COURSE_PUBLISHED"
  | "EXERCISE_PUBLISHED"
  | "ROADMAP_PUBLISHED"
  | "ADMIN_ANNOUNCEMENT";

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
