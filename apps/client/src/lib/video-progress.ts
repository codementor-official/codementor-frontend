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
 * Và cổng 80% là một cái gờ giảm tốc, không phải bằng chứng. Ai mở devtools cũng sửa được
 * con số này. Máy chủ không có cách nào biết một người có thật sự xem hay không, nên hứa
 * hơn thế là nói dối — cùng lý do đã ghi ở `useReadingGate`.
 */

const KEY_PREFIX = "codementor.video-progress.";

export interface VideoProgress {
  /** Điểm dừng lần trước, giây — chỗ hộp thoại mời học tiếp sẽ tua tới. */
  positionSeconds: number;
  /** Tổng số giây đã xem thật, KHÔNG tính các đoạn tua qua. */
  watchedSeconds: number;
  /** Thời lượng video lúc lưu. `0` khi chưa đọc được. */
  durationSeconds: number;
}

/** Phải xem đủ ngần này mới được đánh dấu hoàn thành bài. */
export const REQUIRED_WATCH_RATIO = 0.8;

/**
 * Bước nhảy lớn hơn ngần này là TUA, không phải xem.
 *
 * Nhịp báo vị trí dày hơn nhiều (thẻ `<video>` ~4 lần/giây, YouTube 2 lần/giây), nên một
 * bước 1.5 giây đã là bất thường. Nhờ vậy kéo thanh thời gian tới cuối video không cộng
 * được giây nào — cái mẹo hiển nhiên nhất để qua cổng 80%.
 */
const MAX_STEP_SECONDS = 1.5;

/**
 * Cộng dồn phần đã xem từ hai lần báo vị trí liên tiếp.
 *
 * Không cần biết video đang phát hay đang dừng: đứng yên thì `step` bằng 0, tua tới thì
 * `step` quá lớn, tua lui thì `step` âm. Cả ba đều không cộng gì. Vì thế hàm này không
 * phải lắng nghe `play`/`pause` của ba trình phát khác nhau — điều mà YouTube và Vimeo
 * báo theo hai kiểu chẳng giống nhau.
 */
export function accumulateWatched(
  watchedSeconds: number,
  previousTime: number,
  currentTime: number,
): number {
  const step = currentTime - previousTime;
  if (step <= 0 || step > MAX_STEP_SECONDS) return watchedSeconds;
  return watchedSeconds + step;
}

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

export function readVideoProgress(lessonId: string): VideoProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + lessonId);
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

export function writeVideoProgress(lessonId: string, progress: VideoProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + lessonId, JSON.stringify(progress));
  } catch {
    // ponytail: hết dung lượng hoặc bị chặn — bỏ qua. Mỗi bài tốn khoảng 100 byte nên
    // không dọn rác cũ; đụng trần 5 MB cần vài chục nghìn bài video trong một trình duyệt.
  }
}
