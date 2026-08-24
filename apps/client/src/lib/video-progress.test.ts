/**
 * Self-check cho cổng xem video. Kho này chưa có test runner nào, nên chạy thẳng:
 *
 *   pnpm --filter @codementor/client exec tsx src/lib/video-progress.test.ts
 *
 * Cùng quy ước với `lesson-unlock.test.ts` — chuyển sang runner nào cũng giữ nguyên assert.
 */
import assert from "node:assert/strict";

// Kho lưu trữ giả, dựng TRƯỚC khi nạp module — module đọc `window` ngay lúc gọi hàm nên
// chỉ cần nó tồn tại trước lần gọi đầu tiên.
const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

const {
  accumulateWatched,
  hasWatchedEnough,
  isResumable,
  watchedRatio,
  readVideoProgress,
  writeVideoProgress,
} = await import("./video-progress");
type VideoProgress = import("./video-progress").VideoProgress;

const progress = (overrides: Partial<VideoProgress> = {}): VideoProgress => ({
  positionSeconds: 0,
  watchedSeconds: 0,
  durationSeconds: 600,
  ...overrides,
});

// -- accumulateWatched -----------------------------------------------------

// Phát bình thường: cộng đúng bước nhảy.
assert.equal(accumulateWatched(10, 4, 4.25), 10.25);

// Đứng yên (đang tạm dừng): không cộng gì.
assert.equal(accumulateWatched(10, 4, 4), 10);

// Tua TỚI cuối video — mẹo hiển nhiên nhất để qua cổng. Không được cộng giây nào.
assert.equal(accumulateWatched(10, 4, 595), 10);

// Tua LUI để xem lại: bước âm, cũng không cộng.
assert.equal(accumulateWatched(10, 300, 120), 10);

// Ngay tại ngưỡng vẫn tính là xem; vượt ngưỡng thì không.
assert.equal(accumulateWatched(0, 0, 1.5), 1.5);
assert.equal(accumulateWatched(0, 0, 1.51), 0);

// Xem hết bằng nhiều bước nhỏ thì cộng dồn đủ — đây là đường đi thật của người học.
let watched = 0;
for (let t = 0; t < 500; t += 0.25) watched = accumulateWatched(watched, t, t + 0.25);
assert.ok(Math.abs(watched - 500) < 0.001, `cộng dồn ra ${watched}, cần ~500`);

// -- watchedRatio / hasWatchedEnough ---------------------------------------

assert.equal(watchedRatio(progress({ watchedSeconds: 480 })), 0.8);

// Chưa biết thời lượng thì chưa mở cổng — nếu không, một lần SDK hỏng là mở toang.
assert.equal(watchedRatio(progress({ watchedSeconds: 480, durationSeconds: 0 })), 0);
assert.equal(hasWatchedEnough(progress({ watchedSeconds: 480, durationSeconds: 0 })), false);

// Xem lại vòng hai không đẩy tỉ lệ vượt quá 1.
assert.equal(watchedRatio(progress({ watchedSeconds: 1500 })), 1);

// Đúng 80% là qua, thiếu một chút thì chưa.
assert.equal(hasWatchedEnough(progress({ watchedSeconds: 480 })), true);
assert.equal(hasWatchedEnough(progress({ watchedSeconds: 479 })), false);

// -- isResumable -----------------------------------------------------------

// Mở nhầm rồi thoát ngay không phải "đang học dở".
assert.equal(isResumable(progress({ positionSeconds: 3 })), false);

// Đang xem giữa chừng: mời học tiếp.
assert.equal(isResumable(progress({ positionSeconds: 312 })), true);

// Gần hết video rồi thì mời tua tới là làm phiền.
assert.equal(isResumable(progress({ positionSeconds: 595 })), false);

// Không biết thời lượng nhưng đã đi được một đoạn: vẫn mời.
assert.equal(isResumable(progress({ positionSeconds: 312, durationSeconds: 0 })), true);

console.log("video-progress: tất cả assert đều qua");

// -- Tách biệt theo tài khoản ----------------------------------------------
//
// Lỗi đã xảy ra thật: hai tài khoản dùng chung một trình duyệt đọc trúng tiến trình của
// nhau. A xem hết video, B đăng nhập vào cùng máy mở đúng bài đó thì cổng 80% đã mở sẵn.
// Với khoá học chỉ có một bài bắt buộc, B bấm một cái là xong cả khoá mà không xem gì.

const A = "user-a";
const B = "user-b";
const LESSON = "lesson-1";

writeVideoProgress(A, LESSON, { positionSeconds: 300, watchedSeconds: 500, durationSeconds: 600 });

// A đọc lại được đúng thứ mình ghi.
assert.deepEqual(readVideoProgress(A, LESSON), {
  positionSeconds: 300,
  watchedSeconds: 500,
  durationSeconds: 600,
});

// B thì KHÔNG thấy gì — đây chính là lỗi cần chặn.
assert.equal(readVideoProgress(B, LESSON), null);

// Và vì không thấy gì, cổng của B vẫn đóng.
const bProgress = readVideoProgress(B, LESSON) ?? {
  positionSeconds: 0,
  watchedSeconds: 0,
  durationSeconds: 600,
};
assert.equal(hasWatchedEnough(bProgress), false);
assert.equal(isResumable(bProgress), false);

// Cùng một bài, hai tài khoản, hai bản ghi độc lập — ghi của B không đè lên của A.
writeVideoProgress(B, LESSON, { positionSeconds: 10, watchedSeconds: 10, durationSeconds: 600 });
assert.equal(readVideoProgress(A, LESSON)?.watchedSeconds, 500);
assert.equal(readVideoProgress(B, LESSON)?.watchedSeconds, 10);

// Dữ liệu rác trong localStorage không được làm hỏng phép chia.
store.set("codementor.video-progress.user-c:lesson-1", '{"watchedSeconds":"rất nhiều"}');
assert.deepEqual(readVideoProgress("user-c", LESSON), {
  positionSeconds: 0,
  watchedSeconds: 0,
  durationSeconds: 0,
});

console.log("video-progress: tách biệt theo tài khoản OK");
