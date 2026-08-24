/**
 * Điều khiển một khung phát video — MỘT giao diện cho cả ba nguồn.
 *
 * Thẻ `<video>` nói ra thời lượng và vị trí đang phát ngay trong DOM. YouTube và Vimeo thì
 * không: nội dung nằm trong iframe của bên thứ ba, và không có JavaScript nào của chúng ta
 * đọc được qua ranh giới đó. Muốn biết video dài bao nhiêu, hay học viên đã xem tới đâu,
 * bắt buộc phải hỏi chính người phát — qua SDK mà họ phát hành.
 *
 * Vì thế module này tồn tại: nơi DUY NHẤT biết ba nguồn phát khác nhau. Cả studio giảng
 * viên (đo thời lượng để ràng buộc) lẫn màn học viên (đếm phần đã xem, tua tới điểm dừng)
 * đều gọi `attachPlayer` rồi quên nguồn phát đi.
 *
 * Hỏng thì im lặng: mạng chặn SDK, hoặc video bị chủ sở hữu tắt nhúng, thì `onDuration` và
 * `onTime` không bao giờ được gọi. Người gọi phải xử lý được trường hợp "không biết" —
 * KHÔNG được coi im lặng là 0, vì đó là cách khoá vĩnh viễn một học viên khỏi bài học.
 */
import type { ResolvedVideo } from "./video";

export interface VideoController {
  /** Tua tới `seconds`. Gọi trước khi trình phát sẵn sàng cũng được — lệnh được giữ lại. */
  seek(seconds: number): void;
  /** Gỡ mọi lắng nghe. KHÔNG gỡ iframe — React sở hữu nút DOM đó. */
  destroy(): void;
}

export interface PlayerHandlers {
  /** Gọi một lần khi biết thời lượng. Không bao giờ gọi nếu không đọc được. */
  onDuration?: (seconds: number) => void;
  /** Vị trí đang phát, giây. Nhịp thưa (~4Hz với tệp, 2Hz với YouTube). */
  onTime?: (seconds: number) => void;
}

/** Nhịp hỏi YouTube. SDK của họ không có sự kiện `timeupdate` nào để lắng nghe. */
const YOUTUBE_POLL_MS = 500;

const VIMEO_SDK = "https://player.vimeo.com/api/player.js";
const YOUTUBE_SDK = "https://www.youtube.com/iframe_api";

// -- Nạp SDK ---------------------------------------------------------------

/** Mỗi URL nạp đúng một lần dù bao nhiêu khung phát cùng hỏi. */
const scripts = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scripts.get(src);
  if (cached) return cached;
  const pending = new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error(`Không tải được ${src}`));
    document.head.appendChild(tag);
  });
  scripts.set(src, pending);
  return pending;
}

// Hình dạng TỐI THIỂU của hai SDK — chỉ những gì module này gọi tới. Khai ở đây thay vì
// thêm `@types/youtube` vào package.json: bốn phương thức không đáng một phụ thuộc mới.
interface YouTubePlayer {
  getDuration(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}

interface VimeoPlayer {
  getDuration(): Promise<number>;
  setCurrentTime(seconds: number): Promise<number>;
  on(event: "timeupdate", handler: (data: { seconds: number }) => void): void;
  off(event: "timeupdate"): void;
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: { events?: { onReady?: (event: { target: YouTubePlayer }) => void } },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    Vimeo?: { Player: new (element: HTMLElement) => VimeoPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/**
 * `YT` xuất hiện trên `window` TRƯỚC khi `YT.Player` dùng được — script tự nạp thêm một
 * phần nữa rồi mới gọi `onYouTubeIframeAPIReady`. Dựng trình phát ngay khi script `onload`
 * là gặp `YT.Player is not a constructor`, nên phải đợi đúng callback đó.
 */
let youtubeApi: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (youtubeApi) return youtubeApi;
  youtubeApi = new Promise<YouTubeApi>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    // Giữ lại callback cũ: đây là một biến toàn cục dùng chung, và ghi đè nó là cắt tay
    // bất kỳ đoạn mã nào khác cũng đang đợi YouTube.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API nạp xong nhưng không có Player"));
    };
    loadScript(YOUTUBE_SDK).catch(reject);
  });
  return youtubeApi;
}

// -- Gắn trình phát --------------------------------------------------------

/**
 * `element` phải là `<video>` với nguồn tệp, `<iframe>` với YouTube/Vimeo — đúng thứ mà
 * `resolveVideo` đã quyết định. Iframe YouTube phải mang `enablejsapi=1` trong `src`;
 * `resolveVideo` đã thêm sẵn nên người gọi không cần nhớ.
 */
export function attachPlayer(
  element: HTMLVideoElement | HTMLIFrameElement,
  video: ResolvedVideo,
  handlers: PlayerHandlers,
): VideoController {
  if (video.kind === "file") return attachFile(element as HTMLVideoElement, handlers);
  if (video.kind === "youtube") return attachYouTube(element as HTMLIFrameElement, handlers);
  return attachVimeo(element as HTMLIFrameElement, handlers);
}

function attachFile(element: HTMLVideoElement, handlers: PlayerHandlers): VideoController {
  // Video đang phát dở lúc gắn (React gắn lại sau một lần render) đã có sẵn metadata —
  // `loadedmetadata` sẽ KHÔNG bắn lần nữa, nên phải đọc thẳng.
  const readDuration = () => {
    if (Number.isFinite(element.duration) && element.duration > 0) {
      handlers.onDuration?.(element.duration);
    }
  };
  const onTime = () => handlers.onTime?.(element.currentTime);

  readDuration();
  element.addEventListener("loadedmetadata", readDuration);
  element.addEventListener("timeupdate", onTime);

  return {
    seek: (seconds) => {
      /*
       * Đợi có metadata rồi mới tua. Hộp thoại "học tiếp" hiện ngay lúc mở trang, thường
       * sớm hơn lúc video tải xong, nên nhánh này là đường đi THƯỜNG GẶP chứ không hiếm.
       *
       * Gán thẳng `currentTime` lúc `readyState = 0` không báo lỗi, nhưng nó chỉ ghi lại
       * "vị trí bắt đầu mong muốn": phần tử báo về đúng con số vừa gán kể cả khi sau đó
       * không tua tới đó được. Đo trên Chromium với máy chủ KHÔNG hỗ trợ HTTP Range:
       * gán thẳng → `currentTime` báo 300 trong khi video phát từ 0; đợi metadata rồi gán
       * → `currentTime` về 0, đúng với sự thật.
       *
       * Khác biệt đó mới là lý do phải đợi: nó biến một lần tua hỏng từ chỗ nói dối thành
       * chỗ đo được, và nhờ vậy `continueWatching` mới nói được cho học viên biết.
       */
      if (element.readyState >= 1) {
        element.currentTime = seconds;
        return;
      }
      element.addEventListener("loadedmetadata", () => { element.currentTime = seconds; }, {
        once: true,
      });
    },
    destroy: () => {
      element.removeEventListener("loadedmetadata", readDuration);
      element.removeEventListener("timeupdate", onTime);
    },
  };
}

function attachYouTube(element: HTMLIFrameElement, handlers: PlayerHandlers): VideoController {
  let player: YouTubePlayer | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let pendingSeek: number | null = null;
  let dead = false;

  loadYouTubeApi()
    .then((api) => {
      if (dead) return;
      new api.Player(element, {
        events: {
          onReady: (event) => {
            if (dead) return;
            player = event.target;
            const duration = player.getDuration();
            if (duration > 0) handlers.onDuration?.(duration);
            if (pendingSeek !== null) {
              player.seekTo(pendingSeek, true);
              pendingSeek = null;
            }
            const ready = player;
            timer = setInterval(() => handlers.onTime?.(ready.getCurrentTime()), YOUTUBE_POLL_MS);
          },
        },
      });
    })
    // Mạng chặn SDK, hoặc video tắt nhúng. Im lặng là đúng: người gọi đã phải có đường đi
    // cho trường hợp "không đo được", và một toast lỗi ở đây chỉ làm học viên hoang mang.
    .catch(() => undefined);

  return {
    seek: (seconds) => {
      if (player) player.seekTo(seconds, true);
      else pendingSeek = seconds;
    },
    destroy: () => {
      dead = true;
      if (timer) clearInterval(timer);
      // ponytail: KHÔNG gọi `player.destroy()` — nó gỡ chính iframe khỏi DOM, mà nút đó do
      // React sở hữu, nên React sẽ ném lỗi khi tự đi gỡ nó lúc unmount. Đối tượng nội bộ
      // của YT ở lại, mỗi lần đổi bài một cái. Chỉ đáng lo nếu ai đó đo được rò rỉ thật.
      player = null;
    },
  };
}

function attachVimeo(element: HTMLIFrameElement, handlers: PlayerHandlers): VideoController {
  let player: VimeoPlayer | null = null;
  let pendingSeek: number | null = null;
  let dead = false;

  loadScript(VIMEO_SDK)
    .then(() => {
      if (dead || !window.Vimeo) return;
      const ready = new window.Vimeo.Player(element);
      player = ready;
      ready.getDuration().then(
        (duration) => {
          if (!dead && duration > 0) handlers.onDuration?.(duration);
        },
        () => undefined,
      );
      ready.on("timeupdate", (data) => {
        if (!dead) handlers.onTime?.(data.seconds);
      });
      if (pendingSeek !== null) {
        void ready.setCurrentTime(pendingSeek).catch(() => undefined);
        pendingSeek = null;
      }
    })
    .catch(() => undefined);

  return {
    seek: (seconds) => {
      if (player) void player.setCurrentTime(seconds).catch(() => undefined);
      else pendingSeek = seconds;
    },
    destroy: () => {
      dead = true;
      player?.off("timeupdate");
      player = null;
    },
  };
}
