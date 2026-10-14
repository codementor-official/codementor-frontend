export type CsvValue = string | number | null | undefined;
export type CsvRow = CsvValue[];

/**
 * Dấu thứ tự byte, thứ nói cho Excel biết tệp là UTF-8 — thiếu nó thì mọi chữ có dấu thành
 * ký tự lạ. Dựng từ mã ký tự chứ không dán ký tự thật: U+FEFF vô hình trong trình soạn thảo
 * và đã có lần bị một công cụ lược mất mà không ai thấy.
 */
export const CSV_BOM = String.fromCharCode(0xfeff);

/** CRLF: Excel đọc được LF, nhưng vài công cụ cũ thì không. */
const NEWLINE = "\r\n";

/**
 * Một ô CSV. Số giữ nguyên dạng thô (không phân cách hàng nghìn) để bảng tính cộng được.
 * Chuỗi bắt đầu bằng `= + - @` có thể bị Excel chạy như công thức — tên khóa học, tên học
 * viên do người dùng nhập, nên thêm dấu nháy đơn phía trước.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  const text = typeof value === "string" && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Nội dung tệp: BOM + các dòng ngăn bằng CRLF. */
export function toCsv(rows: CsvRow[]): string {
  return CSV_BOM + rows.map((row) => row.map(csvCell).join(",")).join(NEWLINE);
}

/** Tải một tệp CSV gồm đúng các dòng đã cho (có thể nhiều phần, ngăn bằng dòng trống). */
export function downloadCsvRows(filename: string, rows: CsvRow[]): void {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  // Firefox chỉ tải khi thẻ <a> nằm trong document.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Không thu hồi ngay: Chrome đọc blob sau khi click trả về, thu hồi sớm thì tệp rỗng.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Xuất một bảng: một dòng tiêu đề và các dòng dữ liệu. */
export function downloadCsv(filename: string, headers: string[], rows: CsvRow[]): void {
  downloadCsvRows(filename, [headers, ...rows]);
}

const VN_DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Thời điểm theo giờ Việt Nam dạng `YYYY-MM-DD HH:mm` — dạng Excel/Sheets nhận ra là ngày
 * giờ ở mọi thiết lập vùng. `toLocaleString("vi-VN")` cho "14:30:00 14/10/2026", bảng tính
 * coi là chữ và không sắp xếp hay lọc theo ngày được.
 */
export function csvDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : VN_DATE_TIME.format(date);
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
}

/**
 * Đọc lần lượt mọi trang của một danh sách phân trang để xuất CSV đủ dữ liệu, không chỉ
 * trang đang xem. Có trần số dòng để một bảng rất lớn không treo trình duyệt; `truncated`
 * cho nơi gọi biết để báo người dùng thay vì im lặng xuất thiếu.
 */
export async function collectAllPages<T>(
  load: (page: number) => Promise<PagedResult<T>>,
  maxRows = 5000,
): Promise<{ items: T[]; total: number; truncated: boolean }> {
  const items: T[] = [];
  let total = 0;
  for (let page = 1; ; page++) {
    const result = await load(page);
    total = result.total;
    items.push(...result.items);
    if (!result.items.length || items.length >= total) break;
    if (items.length >= maxRows) return { items: items.slice(0, maxRows), total, truncated: true };
  }
  return { items, total, truncated: false };
}
