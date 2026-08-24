/**
 * Một URL video → cách phát nó.
 *
 * Nguồn phát KHÔNG được lưu riêng thành một cột: bản thân URL đã nói ra nó là YouTube,
 * Vimeo hay một tệp trực tiếp, và lưu thêm một trường `provider` là dựng ra hai chỗ có
 * thể mâu thuẫn nhau — đổi URL mà quên đổi provider thì trình phát chọn sai kiểu nhúng.
 *
 * Dùng chung giữa studio giảng viên (xem trước lúc soạn) và ứng dụng học viên (phát
 * thật). Hai bên phải nhận diện giống hệt nhau, nếu không thì thứ giảng viên xem trước
 * được không phải thứ học viên nhận.
 */

export type VideoKind = "youtube" | "vimeo" | "file";

export interface ResolvedVideo {
  kind: VideoKind;
  /** `iframe src` cho youtube/vimeo, hoặc chính URL gốc cho tệp trực tiếp. */
  src: string;
}

/** Đuôi tệp mà thẻ `<video>` của trình duyệt phát được mà không cần thư viện nào. */
const PLAYABLE_EXTENSIONS = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;

function youtubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) return null;
  // /watch?v=ID, /embed/ID, /shorts/ID, /live/ID — bốn hình dạng người ta thật sự dán vào.
  const fromQuery = url.searchParams.get("v");
  if (fromQuery) return fromQuery;
  const match = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(url.pathname);
  return match?.[1] ?? null;
}

function vimeoId(url: URL): string | null {
  if (!/(^|\.)vimeo\.com$/.test(url.hostname)) return null;
  const match = /^\/(?:video\/)?(\d+)/.exec(url.pathname);
  return match?.[1] ?? null;
}

/**
 * `null` khi URL không dùng được: rỗng, sai cú pháp, hoặc dùng giao thức khác http(s).
 *
 * Chặn giao thức ở đây chứ không ở chỗ hiển thị: một `javascript:` lọt tới thuộc tính
 * `src` là một lỗ script injection, và chỗ duy nhất chắc chắn mọi trình phát đều đi qua
 * là hàm này.
 */
export function resolveVideo(raw: string | null | undefined): ResolvedVideo | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const youtube = youtubeId(url);
  // `enablejsapi=1` là điều kiện để `attachPlayer` hỏi được thời lượng và vị trí đang phát
  // từ iframe YouTube. Thêm ở ĐÂY chứ không ở chỗ gắn trình phát: nơi gọi chỉ có sẵn nút
  // DOM, mà tham số này phải nằm trong `src` từ lúc iframe được dựng — sửa sau là quá muộn.
  if (youtube) {
    return { kind: "youtube", src: `https://www.youtube.com/embed/${youtube}?enablejsapi=1` };
  }

  const vimeo = vimeoId(url);
  if (vimeo) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vimeo}` };

  return { kind: "file", src: url.toString() };
}

/**
 * Một URL không có đuôi tệp quen thuộc và không phải YouTube/Vimeo vẫn được nhận, chỉ là
 * chưa chắc phát được — thẻ `<video>` sẽ tự báo nếu không. Studio dùng cờ này để nhắc
 * người soạn kiểm lại thay vì chặn họ: đường dẫn ký sẵn từ S3 thường không có đuôi tệp,
 * và chặn nó là chặn đúng luồng tải lên của chính hệ thống.
 */
export function looksPlayable(video: ResolvedVideo): boolean {
  return video.kind !== "file" || PLAYABLE_EXTENSIONS.test(video.src);
}

/** `754` → `"12:34"`, `3754` → `"1:02:34"`. Phần giờ chỉ hiện khi video thật sự dài. */
export function formatDuration(totalSeconds: number): string {
  const whole = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Số phút tối thiểu đủ chứa một video dài `videoSeconds` giây. */
export function minimumLessonMinutes(videoSeconds: number): number {
  return Math.max(1, Math.ceil(videoSeconds / 60));
}

/**
 * "Thời lượng bài học phải >= thời lượng video" — trả câu lỗi tiếng Việt, hoặc `undefined`
 * khi hợp lệ. Cùng một luật cho video tải lên và video dán link: cả hai đều chỉ là một URL
 * khi tới được đây, nên không có nhánh nào phân biệt chúng.
 *
 * `null` ở hai đầu đều là "chưa biết", và chưa biết thì KHÔNG chặn. Thời lượng video đọc
 * từ SDK của YouTube/Vimeo, mà SDK thì có thể bị mạng chặn — biến một lần nạp script hỏng
 * thành một bài học không lưu được là đổi một ràng buộc mềm lấy một ngõ cụt.
 */
export function lessonDurationError(
  lessonMinutes: number | null,
  videoSeconds: number | null,
): string | undefined {
  if (lessonMinutes === null || videoSeconds === null || videoSeconds <= 0) return undefined;
  if (lessonMinutes * 60 >= videoSeconds) return undefined;
  return `Thời lượng bài (${lessonMinutes} phút) ngắn hơn video (${formatDuration(videoSeconds)}). Đặt tối thiểu ${minimumLessonMinutes(videoSeconds)} phút.`;
}
