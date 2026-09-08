import type { ExerciseContent } from "@codementor/solve";

/** Một hội thoại cũ, đọc từ `ai_agent_sessions` (đã lọc theo người dùng VÀ theo nhóm). */
export interface LecterSessionSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/** Kết quả `POST /ai/lecter/check/exercise-content` — hình dạng của `verify.summarize`. */
export interface LecterContentCheck {
  errors: string[];
  warnings: string[];
  runs: {
    language: string;
    verdict?: string;
    passedTests?: number;
    totalTests?: number;
    error?: string;
  }[];
}

/**
 * Thay đổi Lecter đề nghị cho biểu mẫu soạn bài.
 *
 * SỬA TỪNG PHẦN, không thay trọn gói: trường không có mặt nghĩa là "giữ nguyên thứ người soạn
 * đang có". Nhờ vậy "viết lại đề bài cho rõ hơn" không xoá mất bộ test case họ vừa gõ tay.
 *
 * Không có `slug` (studio tự sinh từ tiêu đề, và khoá lại khi bài đã đăng), không có `memberIds`,
 * `dueAt`, `publicationStatus` — giao bài và ẩn/hiện là việc của con người. Thiếu chúng trong
 * kiểu này là hàng rào, không phải thiếu sót.
 */
export interface LecterDraftPatch {
  title?: string;
  summary?: string;
  difficulty?: "easy" | "medium" | "hard";
  estimatedMinutes?: number;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  tagIds?: string[];
  content?: Partial<ExerciseContent>;
}

/** Tài liệu đã duyệt của nhóm, đính kèm vào tin nhắn kế tiếp. */
export interface LecterAttachment {
  id: string;
  title: string;
  /**
   * Tài liệu phải index xong Lecter mới đọc được. Gửi sớm thì nó đọc ra rỗng rồi nói sai với
   * người soạn, nên nút Gửi khoá cho tới khi mọi tệp `ready`.
   */
  state: "indexing" | "ready" | "failed";
}
