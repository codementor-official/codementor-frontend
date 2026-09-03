/** Bài viết biên tập — cùng hình dạng learning-service trả về cho admin. */
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: string;
  readMinutes: number | null;
  authorId: string | null;
  authorName: string | null;
  tagName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Lý do admin trả bài lại. Người viết phải đọc được ngay trên danh sách. */
  rejectionReason: string | null;
}

export interface Article extends ArticleListItem {
  rejectionReason: string | null;
  takeaway: string | null;
  tagId: string | null;
  /** HTML từ RichTextEditor. Xem `article_contents.contentHtml`. */
  contentHtml: string;
}

export const ARTICLE_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "rejected",
  "published",
  "archived",
] as const;

export const ARTICLE_STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  changes_requested: "Cần sửa",
  rejected: "Bị từ chối",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

export const ARTICLE_STATUS_TONES: Record<
  string,
  "neutral" | "success" | "warning" | "danger"
> = {
  draft: "neutral",
  pending_review: "warning",
  changes_requested: "warning",
  rejected: "danger",
  published: "success",
  archived: "neutral",
};

/** Bản nháp đang sửa ở studio bài viết. */
export interface Draft {
  title: string;
  /** Định danh trong đường dẫn. Khoá lại sau khi bài đã từng công khai. */
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  takeaway: string;
  readMinutes: string;
  /** "" = chưa chọn chủ đề. */
  tagId: string;
  contentHtml: string;
}

export interface ArticleCoverUploadConfig {
  enabled: boolean;
  maxBytes: number;
  acceptedTypes: string[];
}

export interface ArticleCoverUpload {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}
