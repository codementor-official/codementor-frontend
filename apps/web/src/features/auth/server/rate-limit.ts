/**
 * Cửa sổ trượt đơn giản cho route đăng nhập, chặn việc dò mật khẩu bằng cách bắn liên
 * tục vào BFF. Đây là lớp chặn thứ nhất, không phải lớp duy nhất: brute-force detection
 * của Keycloak mới là thứ khoá tài khoản, và nó vẫn chạy vì mật khẩu vẫn do Keycloak kiểm.
 *
 * ponytail: đếm trong RAM của một tiến trình — chạy nhiều instance Next thì mỗi instance
 * có bộ đếm riêng. Đổi sang Redis khi apps/web thực sự chạy nhiều instance.
 */
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, number[]>();

/** `true` nếu lần thử này còn trong hạn mức. Gọi một lần cho mỗi request đăng nhập. */
export function allowLoginAttempt(key: string, now: number = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  // Ghi lại trước khi trả lời: request bị từ chối vẫn phải tính, nếu không kẻ tấn công
  // chỉ cần bắn nhanh hơn cửa sổ là bộ đếm không bao giờ đầy.
  recent.push(now);
  attempts.set(key, recent);

  // Map sẽ phình theo số IP từng thử đăng nhập nếu không bao giờ dọn.
  if (attempts.size > 10_000) {
    for (const [entry, timestamps] of attempts) {
      if (timestamps.every((at) => now - at >= WINDOW_MS)) attempts.delete(entry);
    }
  }
  return recent.length <= MAX_ATTEMPTS;
}

/** Chỉ dùng cho kiểm thử. */
export function resetLoginAttempts(): void {
  attempts.clear();
}
