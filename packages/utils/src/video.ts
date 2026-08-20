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
  if (youtube) return { kind: "youtube", src: `https://www.youtube.com/embed/${youtube}` };

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
