import { ApiClientError } from "@codementor/api-client";

/**
 * Những hàm mà cả bảng bài tập lẫn Studio bài tập đều dùng. Trước đây chúng nằm trong
 * `workspace-content-tabs.tsx` vì Studio còn là hộp thoại trong chính file đó; Studio đã
 * tách sang trang riêng nên chúng ở đây, không phải chép hai bản.
 */
export function messageOf(error: unknown, fallback = "Có lỗi xảy ra") {
  return error instanceof ApiClientError
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;
}

/** ISO -> giá trị cho `<input type="datetime-local">`, theo múi giờ máy người dùng. */
export function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function slugifyExercise(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
