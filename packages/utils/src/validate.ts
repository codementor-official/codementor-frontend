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

/** `129600` → `129.600`: số lớn trong câu lỗi phải đọc được ngay. */
const fmt = (n: number) => n.toLocaleString("vi-VN");

/**
 * Số nguyên trong khoảng. Ô trống hợp lệ khi `optional`, vì "chưa điền" khác "điền sai".
 *
 * Ô số luôn giữ state dạng CHUỖI (`inputMode="numeric"`, không `type="number"`): ép
 * `Number("")` về 0 là thứ sinh ra "012" khi người dùng gõ tiếp vào ô vừa xoá.
 * Số âm được nhận dạng riêng để câu lỗi nói đúng khoảng thay vì "không phải số nguyên".
 */
export function integer(
  value: string,
  label: string,
  { min = 1, max = Number.MAX_SAFE_INTEGER, optional = true } = {},
): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return optional ? undefined : `${label} không được để trống`;
  if (!/^-?\d+$/.test(trimmed)) return `${label} phải là số nguyên`;

  const parsed = Number(trimmed);
  if (parsed < min) return `${label} phải từ ${fmt(min)} trở lên`;
  if (parsed > max) return `${label} tối đa ${fmt(max)}`;
  return undefined;
}

/** Số thập phân trong khoảng, tối đa `scale` chữ số sau dấu phẩy. Nhận cả `,` lẫn `.`. */
export function decimal(
  value: string,
  label: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER, scale = 2, optional = true } = {},
): FieldError {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) return optional ? undefined : `${label} không được để trống`;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return `${label} phải là số`;
  if ((trimmed.split(".")[1] ?? "").length > scale) {
    return `${label} tối đa ${scale} chữ số thập phân`;
  }

  const parsed = Number(trimmed);
  if (parsed < min) return `${label} phải từ ${fmt(min)} trở lên`;
  if (parsed > max) return `${label} tối đa ${fmt(max)}`;
  return undefined;
}

/** Chuỗi của ô số → số để gửi đi. Chỉ gọi khi ô đã qua `integer`/`decimal`. */
export function toNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

/**
 * Độ dài trong khoảng `[min, max]`, tính trên chuỗi đã trim — form gửi bản đã trim nên
 * backend đếm đúng con số này. Ô vượt max vẫn gõ tiếp được (không `maxLength` cứng: dán
 * một đoạn dài mà bị cắt im lặng là mất chữ); câu lỗi này là thứ chặn lại.
 */
export function length(
  value: string,
  label: string,
  { min = 0, max, optional = min === 0 }: { min?: number; max: number; optional?: boolean },
): FieldError {
  const size = value.trim().length;
  if (size === 0) return optional ? undefined : `${label} không được để trống`;
  if (size < min) return `${label} tối thiểu ${fmt(min)} ký tự`;
  if (size > max) return `${label} tối đa ${fmt(max)} ký tự (đang có ${fmt(size)})`;
  return undefined;
}

/** Bản sao `Email.PATTERN` ở core-service — `type="email"` của trình duyệt nhận cả `a@b`. */
export function email(value: string, label = "Email"): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return `${label} không được để trống`;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) ? undefined : `${label} không hợp lệ`;
}

/**
 * Bản sao `Handle.PATTERN` ở core-service. Backend hạ chữ thường TRƯỚC khi kiểm, nên ở
 * đây cũng vậy — "GiaSi" là hợp lệ và được lưu thành "giasi". Để trống = không có handle.
 */
export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;
export function handle(value: string, label = "Handle"): FieldError {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return undefined;
  return HANDLE_PATTERN.test(normalized)
    ? undefined
    : `${label} dài 3–30 ký tự, chỉ gồm chữ, số, gạch ngang hoặc gạch dưới, không bắt đầu/kết thúc bằng gạch`;
}

/** Bản sao luật GitHub trong `User.updateProfile`. Để trống hợp lệ. */
export const GITHUB_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
export function githubHandle(value: string, label = "Tên GitHub"): FieldError {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return GITHUB_PATTERN.test(trimmed)
    ? undefined
    : `${label} tối đa 39 ký tự, chỉ gồm chữ, số và gạch ngang, không bắt đầu/kết thúc bằng gạch`;
}

/**
 * Ô tìm kiếm: chỉ lỗi khi quá trần `q` của endpoint. Trống hay toàn khoảng trắng là
 * "không lọc" — trả danh sách đầy đủ, không phải lỗi.
 */
export function search(value: string, max: number): FieldError {
  return value.trim().length > max ? `Từ khóa tối đa ${fmt(max)} ký tự` : undefined;
}

/**
 * Mọi ô "lý do" (gỡ, từ chối, hoàn tiền, duyệt…) dùng chung một khoảng: 3–500 là phần
 * giao của mọi DTO đang nhận lý do (commerce 3–1000, moderate ≤2000, workspace 1–500,
 * report 1–1000), nên không endpoint nào bị vượt. Chỉ chặn ở frontend — backend giữ luật
 * riêng của nó.
 */
export const REASON_MIN = 3;
export const REASON_MAX = 500;
export function reason(value: string, label = "Lý do"): FieldError {
  return length(value, label, { min: REASON_MIN, max: REASON_MAX });
}

/**
 * Cặp từ/đến. Lỗi gắn vào ô "đến". `strict` = đến phải SAU từ (khuyến mãi); không strict
 * = được bằng nhau (lọc theo ngày). So chuỗi được vì cả `date` lẫn `datetime-local` đều
 * là ISO cùng độ dài.
 */
export function dateRange(
  from: string,
  to: string,
  { strict = false, label = "Ngày kết thúc" } = {},
): FieldError {
  if (!from || !to) return undefined;
  if (strict ? to <= from : to < from) {
    return strict ? `${label} phải sau thời điểm bắt đầu` : `${label} phải từ ngày bắt đầu trở đi`;
  }
  return undefined;
}

/**
 * Form khuyến mãi — dùng chung cho Admin (đơn lẻ + theo lô) và Giảng viên. Bản sao của
 * `PromotionDto`/`BatchPromotionDto` (tên 2–60, giá 1.000–1.000.000.000, giảm 1–99%) cộng
 * luật ở `CommerceAccessService` (kết thúc sau bắt đầu, giá ưu đãi thấp hơn giá niêm yết).
 * Truyền `salePrice` cho form theo giá, `discount` cho form theo phần trăm.
 */
export function promotion(input: {
  label: string;
  startsAt: string;
  endsAt: string;
  salePrice?: string;
  listPrice?: number;
  discount?: string;
}): Record<"label" | "startsAt" | "endsAt" | "salePrice" | "discount", FieldError> {
  const salePrice =
    input.salePrice === undefined
      ? undefined
      : (integer(input.salePrice, "Giá ưu đãi", { min: 1000, max: 1_000_000_000, optional: false }) ??
        (input.listPrice !== undefined && toNumber(input.salePrice) >= input.listPrice
          ? `Giá ưu đãi phải thấp hơn giá niêm yết (${fmt(input.listPrice)} ₫)`
          : undefined));
  return {
    label: length(input.label, "Tên chương trình", { min: 2, max: 60 }),
    startsAt: input.startsAt ? undefined : "Chọn thời điểm bắt đầu",
    endsAt: input.endsAt
      ? dateRange(input.startsAt, input.endsAt, { strict: true, label: "Thời điểm kết thúc" })
      : "Chọn thời điểm kết thúc",
    salePrice,
    discount:
      input.discount === undefined
        ? undefined
        : integer(input.discount, "Mức giảm", { min: 1, max: 99, optional: false }),
  };
}

/**
 * Tên hàm ở chế độ hàm — bản sao `FUNCTION_NAME_PATTERN` và `RESERVED_WORDS` trong
 * `exercise-content.ts` (exercise-service). Backend chỉ kiểm lúc gửi duyệt; form báo ngay.
 */
const RESERVED_WORDS = new Set([
  "abstract", "and", "as", "assert", "async", "await", "boolean", "break", "byte", "case",
  "catch", "char", "class", "const", "continue", "def", "default", "del", "delete", "do",
  "double", "elif", "else", "enum", "except", "export", "extends", "false", "final", "finally",
  "float", "for", "from", "function", "global", "goto", "if", "implements", "import", "in",
  "instanceof", "int", "interface", "is", "lambda", "let", "long", "native", "new", "none",
  "nonlocal", "not", "null", "or", "package", "pass", "private", "protected", "public",
  "raise", "return", "short", "static", "super", "switch", "synchronized", "this", "throw",
  "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with",
  "yield",
]);
export function functionName(value: string, label = "Tên hàm"): FieldError {
  const name = value.trim();
  if (name.length === 0) return `${label} không được để trống`;
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return `${label} phải là snake_case: bắt đầu bằng chữ thường, chỉ gồm chữ thường, số, gạch dưới`;
  }
  if (RESERVED_WORDS.has(name)) return `${label} "${name}" trùng từ khoá của Python/JavaScript/Java`;
  return undefined;
}

/** `true` khi mọi ô đều hợp lệ — dùng để khoá nút Lưu. */
export function isClean(errors: Record<string, FieldError>): boolean {
  return Object.values(errors).every((error) => error === undefined);
}

/**
 * Tiêu đề → slug. Bản SAO của `Slug.fromTitle` / `slugify` ở backend (cùng thứ tự phép
 * biến đổi, cùng trần 70 ký tự) — form sinh trước để người soạn thấy và sửa được, backend
 * vẫn là nơi chốt và là nơi xử va chạm slug trùng.
 *
 * Bỏ dấu tiếng Việt TRƯỚC khi lọc ký tự: không bỏ thì "Đệ quy" ra "quy", mất luôn từ đầu.
 */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Slug sau khi đổi tiêu đề — dùng ở mọi ô "Tiêu đề" của studio.
 *
 * Chỉ sinh lại khi slug hiện tại ĐÚNG là bản sinh từ tiêu đề cũ. Người soạn từng tự sửa
 * slug (hoặc backend đã gắn hậu tố chống trùng) thì giữ nguyên: một đường dẫn đã được
 * chọn tay không được lặng lẽ đổi vì ai đó sửa một chữ trong tiêu đề.
 */
export function retitleSlug(currentSlug: string, prevTitle: string, nextTitle: string): string {
  return currentSlug === slugify(prevTitle) ? slugify(nextTitle) : currentSlug;
}
