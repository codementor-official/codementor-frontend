/**
 * Đã ăn mừng hoàn thành khóa học này chưa — một cờ CỦA TRÌNH DUYỆT, không phải của máy chủ.
 *
 * Không thể suy ra từ `enrollment.status`: trigger `fn_refresh_course_progress` (migration
 * `0012`) lật status sang `completed` ngay khoảnh khắc bài bắt buộc cuối cùng được đánh dấu
 * xong. Lấy status làm mốc thì nút "Hoàn thành khóa học" biến thành "Về trang chính" trước
 * khi người học kịp bấm, và màn ăn mừng không bao giờ chạy.
 *
 * Mất cờ (xoá dữ liệu duyệt web, máy khác) thì người học được ăn mừng thêm một lần nữa —
 * hậu quả đúng mức với thứ chỉ là hiệu ứng pháo hoa.
 */
const KEY_PREFIX = "codementor-course-celebrated:";
const PENDING_KEY = "codementor-course-celebrate-pending";

/**
 * "Vừa bấm hoàn thành khóa học xong" — bàn giao từ trang bài học sang trang khóa học.
 *
 * KHÔNG dùng query param (`?completed=1`) cho việc này. `router.push` là điều hướng phía
 * client: khi trang khóa học render lần đầu, `window.location.search` vẫn còn là URL của
 * trang bài học, nên cờ đọc ra luôn bằng false và màn ăn mừng không bao giờ chạy — đúng lỗi
 * đã đo được ngày 2026-08-23. Ghi vào `sessionStorage` thì xảy ra ngay lúc bấm, trước khi
 * điều hướng, nên không phụ thuộc vào thời điểm trình duyệt cập nhật URL.
 */
export function requestCourseCelebration(courseId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_KEY, courseId);
  } catch {
    // Không ghi được thì chỉ mất hiệu ứng, không ảnh hưởng việc điều hướng.
  }
}

/** Đọc và xoá cờ — ăn mừng đúng một lần, tải lại trang không phát lại. */
export function consumeCourseCelebration(courseId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(PENDING_KEY) !== courseId) return false;
    window.sessionStorage.removeItem(PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasCelebratedCourse(courseId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY_PREFIX + courseId) === "1";
  } catch {
    // Chế độ riêng tư / chặn lưu trữ: coi như chưa ăn mừng, không làm hỏng trang.
    return false;
  }
}

export function markCourseCelebrated(courseId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + courseId, "1");
  } catch {
    // Ghi hỏng cũng không sao — cùng lắm là lần sau ăn mừng lại.
  }
}
