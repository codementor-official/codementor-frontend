/**
 * Luật kiểm dữ liệu dùng chung cho các form soạn nội dung.
 *
 * Mỗi hàm trả về **câu lỗi tiếng Việt** hoặc `undefined` khi hợp lệ — không phải boolean.
 * Nơi gọi cần đúng chuỗi đó để hiện dưới ô nhập, và trả boolean thì mỗi form lại tự nghĩ
 * ra một cách diễn đạt khác nhau cho cùng một luật.
 *
 * Đây là bản SAO của ràng buộc ở backend (`class-validator` trong các DTO), không phải
 * bản thay thế: form chặn sớm để người soạn biết ngay, còn backend mới là nơi thực sự
 * quyết định — mọi giới hạn ở đây đều phải khớp với DTO tương ứng, và khi lệch thì backend
 * đúng.
 */

export type FieldError = string | undefined;

const URL_MAX = 2048;

export function required(value: string, label: string): FieldError {
  return value.trim().length === 0 ? `${label} không được để trống` : undefined;
}

export function maxLength(value: string, limit: number, label: string): FieldError {
  return value.trim().length > limit ? `${label} tối đa ${limit} ký tự` : undefined;
}

/** Bắt buộc có, và không vượt trần. Ghép hai luật hay đi cùng nhau nhất. */
export function text(value: string, limit: number, label: string): FieldError {
  return required(value, label) ?? maxLength(value, limit, label);
}

/**
 * Khớp `SLUG_PATTERN` ở domain: 3–80 ký tự, chữ thường/số/gạch ngang, không mở đầu hay
 * kết thúc bằng gạch.
 */
export function slug(value: string): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Slug không được để trống";
  if (!/^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])$/.test(trimmed)) {
    return "Slug dài 3–80 ký tự, chỉ gồm chữ thường, số và gạch ngang, không bắt đầu/kết thúc bằng gạch";
  }
  return undefined;
}

/**
 * Chỉ nhận http/https. Chặn giao thức khác ở đây chứ không ở chỗ hiển thị: một
 * `javascript:` lọt tới thuộc tính `src` hay `href` là script injection, và form là chỗ
 * đầu tiên nó đi qua.
 */
export function url(value: string, label: string, { optional = true } = {}): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return optional ? undefined : `${label} không được để trống`;
  if (trimmed.length > URL_MAX) return `${label} tối đa ${URL_MAX} ký tự`;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return `${label} không hợp lệ — cần dạng https://…`;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:"
    ? undefined
    : `${label} phải bắt đầu bằng http:// hoặc https://`;
}

/** Số nguyên trong khoảng. Ô trống hợp lệ khi `optional`, vì "chưa điền" khác "điền sai". */
export function integer(
  value: string,
  label: string,
  { min = 1, max = Number.MAX_SAFE_INTEGER, optional = true } = {},
): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return optional ? undefined : `${label} không được để trống`;
  if (!/^\d+$/.test(trimmed)) return `${label} phải là số nguyên`;

  const parsed = Number(trimmed);
  if (parsed < min) return `${label} phải từ ${min} trở lên`;
  if (parsed > max) return `${label} tối đa ${max}`;
  return undefined;
}

/** `true` khi mọi ô đều hợp lệ — dùng để khoá nút Lưu. */
export function isClean(errors: Record<string, FieldError>): boolean {
  return Object.values(errors).every((error) => error === undefined);
}
