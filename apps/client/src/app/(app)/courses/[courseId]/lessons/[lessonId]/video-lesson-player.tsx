"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, useToast } from "@codementor/ui";
import { attachPlayer, formatDuration, type ResolvedVideo, type VideoController } from "@codementor/utils";
import { PlayCircle, RotateCcw } from "lucide-react";
import {
  REQUIRED_WATCH_RATIO,
  accumulateWatched,
  isResumable,
  readVideoProgress,
  writeVideoProgress,
  type VideoProgress,
} from "@/lib/video-progress";
import { useAuth } from "@/providers/auth-provider";

/** Ghi xuống localStorage thưa thôi — mỗi giây một lần là thừa cho một con số dùng để tua. */
const SAVE_EVERY_MS = 5000;

/** Chờ ngần này rồi mới kết luận lệnh tua có ăn hay không. */
const SEEK_CHECK_MS = 2000;

/** Lệch quá ngần này so với đích thì coi như tua hỏng, không phải sai số phát tiếp. */
const SEEK_TOLERANCE_SECONDS = 5;

/**
 * Đợi trình phát nói ra thời lượng trong ngần này rồi thôi.
 *
 * Hết giờ nghĩa là SDK của YouTube/Vimeo không tới được (mạng chặn, hoặc chủ video tắt
 * nhúng). Lúc đó cổng 80% KHÔNG thể tính, và bài học phải rơi về cổng đọc thường — khoá
 * vĩnh viễn một học viên khỏi bài học chỉ vì một script không tải được là lỗi nặng hơn
 * nhiều so với việc bỏ lọt một cái gờ giảm tốc.
 */
const DURATION_TIMEOUT_MS = 8000;

export interface WatchGate {
  /** `null` = còn đang hỏi thời lượng. `false` = chịu, người gọi phải dùng cổng khác. */
  measurable: boolean | null;
  /** Đã xem đủ `REQUIRED_WATCH_RATIO` chưa. */
  enough: boolean;
}

/**
 * Khung phát video của học viên, kèm hai thứ mà một thẻ `<video>` trần không có: đếm phần
 * đã xem, và mời học tiếp từ chỗ đang dở.
 *
 * Phần đã xem đếm bằng cách cộng dồn các bước nhảy nhỏ của kim thời gian (xem
 * `accumulateWatched`), nên kéo thanh tua tới cuối không qua được cổng. Cả ba nguồn phát
 * đi chung một đường: `attachPlayer` đã giấu sự khác nhau giữa `<video>`, YouTube và Vimeo.
 */
export function VideoLessonPlayer({
  lessonId,
  video,
  title,
  authoredDurationSeconds,
  completed,
  onGateChange,
}: {
  lessonId: string;
  video: ResolvedVideo;
  title: string;
  /** Thời lượng giảng viên đã ghi kèm khi soạn bài, giây. Dùng khi SDK chậm hoặc câm. */
  authoredDurationSeconds?: number;
  completed: boolean;
  onGateChange: (gate: WatchGate) => void;
}) {
  // Tiến trình xem là của MỘT tài khoản, không phải của một trình duyệt. Đọc danh tính
  // ngay tại đây thay vì nhận qua prop: chỉ chỗ này cần nó, và luồn thêm một prop qua
  // `TheoryLesson` là thêm một chỗ nữa có thể quên truyền.
  const userId = useAuth().user?.id;
  const toast = useToast();
  const fileRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const controllerRef = useRef<VideoController | null>(null);

  // Con số thay đổi 4 lần/giây thì để trong ref, không để trong state: mỗi `setState` là
  // một lần render lại cả bài học, và không ai cần thấy tiến trình mượt tới từng khung hình.
  const watchedRef = useRef(0);
  const positionRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const durationRef = useRef(authoredDurationSeconds ?? 0);
  const savedAtRef = useRef(0);

  const [duration, setDuration] = useState<number>(authoredDurationSeconds ?? 0);
  const [measurable, setMeasurable] = useState<boolean | null>(
    authoredDurationSeconds ? true : null,
  );
  const [ratio, setRatio] = useState(0);
  const [resume, setResume] = useState<VideoProgress | null>(null);

  const snapshot = useCallback(
    (): VideoProgress => ({
      positionSeconds: positionRef.current,
      watchedSeconds: watchedRef.current,
      durationSeconds: durationRef.current,
    }),
    [],
  );

  /*
   * Nạp lại phần đã xem của LẦN TRƯỚC. Không có bước này thì cổng 80% chỉ tính trong đúng
   * một lần mở trang, và một bài dài 40 phút thành ra không thể qua nổi nếu nghỉ giữa chừng.
   *
   * Đọc SAU khi mount chứ không phải lúc render: `localStorage` không tồn tại ở máy chủ,
   * nên đọc trong lúc render sẽ cho hai kết quả khác nhau giữa hai bên và hỏng hydrate.
   * Cùng lý do với `hasCelebratedCourse` ở `lesson-view.tsx`.
   *
   * Không cần dọn state cũ: người gọi đặt `key` theo bài nên đổi bài là dựng lại từ đầu.
   */
  useEffect(() => {
    if (!userId) return;
    const stored = readVideoProgress(userId, lessonId);
    if (!stored) return;
    watchedRef.current = stored.watchedSeconds;
    positionRef.current = stored.positionSeconds;
    if (!completed && isResumable(stored)) setResume(stored);
    // `completed` cố tình đứng ngoài danh sách phụ thuộc: nó đổi NGAY khi học viên bấm
    // hoàn thành, và chạy lại hiệu ứng lúc đó sẽ mời học tiếp một bài vừa mới học xong.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, userId]);

  const noteDuration = useCallback((seconds: number) => {
    durationRef.current = seconds;
    setDuration(seconds);
    setMeasurable(true);
  }, []);

  const noteTime = useCallback(
    (seconds: number) => {
      positionRef.current = seconds;
      const previous = lastTimeRef.current;
      lastTimeRef.current = seconds;
      if (previous !== null) {
        watchedRef.current = accumulateWatched(watchedRef.current, previous, seconds);
      }

      if (durationRef.current > 0) {
        setRatio(Math.min(1, watchedRef.current / durationRef.current));
      }

      const now = Date.now();
      if (userId && now - savedAtRef.current >= SAVE_EVERY_MS) {
        savedAtRef.current = now;
        writeVideoProgress(userId, lessonId, snapshot());
      }
    },
    [lessonId, snapshot, userId],
  );

  useEffect(() => {
    const element = video.kind === "file" ? fileRef.current : frameRef.current;
    if (!element) return;
    const controller = attachPlayer(element, video, {
      onDuration: noteDuration,
      onTime: noteTime,
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [video, noteDuration, noteTime]);

  // Hết giờ chờ mà vẫn chưa ai nói thời lượng → bỏ cuộc, để người gọi mở cổng dự phòng.
  useEffect(() => {
    if (measurable !== null) return;
    const timer = setTimeout(() => setMeasurable((current) => current ?? false), DURATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [measurable, video.src]);

  // Lưu lần cuối lúc rời trang. `pagehide` bắt được cả đóng tab lẫn chuyển sang trang khác,
  // thứ mà `beforeunload` trên thiết bị di động thường bỏ sót.
  useEffect(() => {
    if (!userId) return;
    const save = () => writeVideoProgress(userId, lessonId, snapshot());
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [lessonId, snapshot, userId]);

  const enough = duration > 0 && ratio >= REQUIRED_WATCH_RATIO;
  useEffect(() => {
    onGateChange({ measurable, enough });
  }, [measurable, enough, onGateChange]);

  const continueWatching = () => {
    const target = resume?.positionSeconds ?? 0;
    controllerRef.current?.seek(target);
    setResume(null);

    /*
     * Kiểm lại xem lệnh tua có ăn không, và NÓI RA nếu không.
     *
     * Tệp video phục vụ từ một máy chủ không hỗ trợ HTTP Range thì trình duyệt không tua
     * được: `currentTime` gán vào rồi bật lại 0, không có sự kiện lỗi nào. Học viên bấm
     * "Học tiếp" và video đứng im ở đầu — im lặng là cách tệ nhất để hỏng.
     *
     * Chỉ kiểm với nguồn TỆP: YouTube/Vimeo tự lo việc phân phối nên luôn tua được, còn
     * `currentTime` của chúng phải hỏi qua SDK và Vimeo chỉ báo khi đang phát — kiểm ở đó
     * sẽ báo động giả với một video đang tạm dừng.
     */
    if (video.kind !== "file" || target <= 0) return;
    window.setTimeout(() => {
      const element = fileRef.current;
      if (!element) return;
      if (Math.abs(element.currentTime - target) > SEEK_TOLERANCE_SECONDS) {
        toast.error(
          "Không tua tới được chỗ đang học dở — máy chủ chứa video này không cho tua. Bạn cần xem lại từ đầu.",
        );
      }
    }, SEEK_CHECK_MS);
  };

  const startOver = () => {
    // Giữ lại phần đã xem: học viên đã bỏ công xem thật, chọn quay về đầu không phải lý do
    // bắt họ tích luỹ lại từ số không. Chỉ điểm dừng là bỏ.
    positionRef.current = 0;
    lastTimeRef.current = null;
    controllerRef.current?.seek(0);
    if (userId) writeVideoProgress(userId, lessonId, snapshot());
    setResume(null);
  };

  return (
    <div className="mt-5">
      {video.kind === "file" ? (
        <video
          className="w-full rounded-lg border border-border-soft bg-ink-fixed"
          controls
          preload="metadata"
          ref={fileRef}
          src={video.src}
        />
      ) : (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-lg border border-border-soft"
          ref={frameRef}
          src={video.src}
          title={title}
        />
      )}

      {!completed && <WatchMeter duration={duration} measurable={measurable} ratio={ratio} />}

      <Modal
        description={
          resume
            ? `Lần trước bạn dừng ở ${formatDuration(resume.positionSeconds)}.`
            : undefined
        }
        onClose={() => setResume(null)}
        open={resume !== null}
        title="Bạn đang học dở bài này"
        width="sm"
        footer={
          <>
            <button
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-navy transition-colors hover:bg-bg"
              onClick={startOver}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Xem lại từ đầu
            </button>
            <button
              className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-on-ink transition-colors hover:bg-primary-hover"
              onClick={continueWatching}
              type="button"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Học tiếp
            </button>
          </>
        }
      >
        <p className="text-sm text-text">
          Tiếp tục từ chỗ đang dở, hay xem lại từ đầu? Phần bạn đã xem vẫn được giữ nguyên
          trong cả hai trường hợp.
        </p>
      </Modal>
    </div>
  );
}

/** Cho học viên thấy còn thiếu bao nhiêu — cổng khoá mà không nói lý do là cổng gây ức chế. */
function WatchMeter({
  ratio,
  duration,
  measurable,
}: {
  ratio: number;
  duration: number;
  measurable: boolean | null;
}) {
  if (measurable === false) {
    return (
      <p className="mt-2 text-xs text-text-faint">
        Không đọc được thời lượng video này, nên phần đã xem không tính được.
      </p>
    );
  }
  if (duration <= 0) {
    return <p className="mt-2 text-xs text-text-faint">Đang tải video…</p>;
  }

  const percent = Math.round(ratio * 100);
  const target = Math.round(REQUIRED_WATCH_RATIO * 100);
  const done = ratio >= REQUIRED_WATCH_RATIO;

  return (
    <div className="mt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-border-soft">
        <div
          className={`h-full transition-[width] ${done ? "bg-primary" : "bg-navy"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-text-faint">
        {done
          ? `Đã xem ${percent}% — đủ điều kiện hoàn thành bài.`
          : `Đã xem ${percent}% · cần ${target}% để hoàn thành bài (video dài ${formatDuration(duration)}).`}
      </p>
    </div>
  );
}
