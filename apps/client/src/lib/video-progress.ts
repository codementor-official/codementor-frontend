/**
 * Tiến trình xem video của một bài học — CHỈ nằm trong trình duyệt này.
 *
 * Máy chủ chỉ biết một điều về bài học: đã hoàn thành hay chưa. Phần trăm đã xem và điểm
 * dừng thì không, và đó là chủ ý:
 *
 *  - Bảng `lesson_progress` không có cột nào chứa "phần đã xem". Có `last_position_seconds`
 *    nhưng đó là ĐIỂM DỪNG, không phải tổng tích luỹ — nhét phần trăm vào đó là làm sai
 *    nghĩa một cột đang dùng, còn thêm cột mới là một migration cho một con số mà chỉ
 *    trình duyệt mới tính được.
 *  - Ghi lên máy chủ lúc rời trang phải đi qua `sendBeacon` mới chắc tới nơi; `fetch` trong
 *    `pagehide` hay bị huỷ giữa chừng. `localStorage.setItem` thì đồng bộ và không hỏng.
 *
 * Giá phải trả, nói thẳng: đổi máy hoặc xoá dữ liệu duyệt web là mất điểm dừng và phần đã
 * xem, phải xem lại từ đầu. Thứ KHÔNG mất là `completed` — nó nằm ở máy chủ.
 *
 * Cổng 80% chỉ hỏi "đã tới được 80% video chưa", tua cũng tính — nó là lời nhắc xem bài,
 * không phải bằng chứng đã xem.
 */

const KEY_PREFIX = "codementor.video-progress.";

/**
 * Khoá lưu trữ LUÔN mang danh tính chủ nhân.
 *
 * Thiếu nó thì hai tài khoản dùng chung một trình duyệt đọc trúng tiến trình của nhau:
 * A xem hết video, B đăng nhập vào cùng máy và mở đúng bài đó thì cổng 80% đã mở sẵn —
 * B bấm hoàn thành ngay mà không xem một giây nào. Với khoá học chỉ có một bài bắt buộc,
 * đó là cả khoá học tự xong.
 *
 * `userId` là tham số BẮT BUỘC chứ không phải tuỳ chọn: để nó tuỳ chọn thì chỗ gọi nào
 * quên truyền sẽ lặng lẽ quay về đúng cái lỗi này, và trình biên dịch không nói gì.
 */
function keyFor(userId: string, lessonId: string): string {
  return `${KEY_PREFIX}${userId}:${lessonId}`;
}

export interface VideoProgress {
  /** Điểm dừng lần trước, giây — chỗ hộp thoại mời học tiếp sẽ tua tới. */
  positionSeconds: number;
  /**
   * Vị trí xa nhất đã tới, giây — tua tới cũng tính (chủ dự án chốt 2026-10-28: tua hết video
   * là được qua bài). Tua lui để xem lại không làm con số này giảm.
   */
  watchedSeconds: number;
  /** Thời lượng video lúc lưu. `0` khi chưa đọc được. */
  durationSeconds: number;
}

/** Phải xem đủ ngần này mới được đánh dấu hoàn thành bài. */
export const REQUIRED_WATCH_RATIO = 0.8;

/** Phần đã xem, chặn ở 1. `0` khi chưa biết thời lượng — chưa biết thì chưa mở cổng. */
export function watchedRatio(progress: VideoProgress): number {
  if (progress.durationSeconds <= 0) return 0;
  return Math.min(1, progress.watchedSeconds / progress.durationSeconds);
}

export function hasWatchedEnough(progress: VideoProgress): boolean {
  return watchedRatio(progress) >= REQUIRED_WATCH_RATIO;
}

/**
 * Có đáng mời học tiếp không.
 *
 * Bỏ qua vài giây đầu (mở nhầm rồi thoát ngay không phải "học dở") và đoạn cuối video
 * (mời tua tới giây 0:03 trước khi hết phim là làm phiền chứ không giúp gì).
 */
export function isResumable(progress: VideoProgress): boolean {
  if (progress.positionSeconds < 10) return false;
  if (progress.durationSeconds <= 0) return true;
  return progress.positionSeconds < progress.durationSeconds - 15;
}

// -- Lưu trữ ---------------------------------------------------------------

export function readVideoProgress(userId: string, lessonId: string): VideoProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId, lessonId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Partial<VideoProgress>;
    // Đọc từng trường thay vì tin cả đối tượng: đây là dữ liệu người dùng sửa được, và một
    // `watchedSeconds: "rất nhiều"` lọt vào phép chia sẽ cho ra `NaN` ở khắp nơi.
    const numeric = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
    return {
      positionSeconds: numeric(record.positionSeconds),
      watchedSeconds: numeric(record.watchedSeconds),
      durationSeconds: numeric(record.durationSeconds),
    };
  } catch {
    // JSON hỏng, hoặc chế độ riêng tư chặn đọc. Coi như chưa xem lần nào.
    return null;
  }
}

export function writeVideoProgress(
  userId: string,
  lessonId: string,
  progress: VideoProgress,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(userId, lessonId), JSON.stringify(progress));
  } catch {
    // ponytail: hết dung lượng hoặc bị chặn — bỏ qua. Mỗi bài tốn khoảng 100 byte nên
    // không dọn rác cũ, kể cả mục của tài khoản đã đăng xuất: khoá đã mang `userId` nên
    // chúng vô hình với người khác. Đụng trần 5 MB cần vài chục nghìn mục.
  }
}
