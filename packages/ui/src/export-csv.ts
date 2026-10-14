import type { RowData, Table } from "@tanstack/react-table";
import { CONTENT_STATUS_LABELS, FIELD_LABELS, LEVEL_LABELS } from "@codementor/types";
import { csvDateTime, downloadCsvRows } from "@codementor/utils";

/**
 * Mã nội bộ → nhãn người đọc, cho các cột chưa khai `exportValue`. Bảng hiện "Đã công khai"
 * nhưng giá trị thô là `published`; tệp xuất phải đọc được như bảng. Độ khó bài code là bản
 * sao `DIFFICULTY_LABELS` của `@codementor/solve` (gói này không phụ thuộc solve).
 */
const CODE_LABELS: Record<string, string> = {
  ...FIELD_LABELS,
  ...LEVEL_LABELS,
  ...CONTENT_STATUS_LABELS,
  easy: "Cơ bản",
  medium: "Trung bình",
  hard: "Nâng cao",
};
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Giá trị thô của ô → giá trị trong tệp: dịch mã, thời điểm ISO thành giờ Việt Nam. */
export function exportCell(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (value == null) return "";
  const text = String(value);
  if (ISO_TIMESTAMP.test(text)) return csvDateTime(text);
  return CODE_LABELS[text] ?? text;
}

/**
 * Giá trị một cột sẽ mang sang tệp xuất. Khai trong `meta` của cột khi giá trị thô khác
 * với thứ đang hiện trên bảng — `role` lưu là `learner` nhưng bảng hiện "Học viên", và
 * người mở tệp cần đọc được cái sau.
 */
export interface ExportableColumnMeta<TData> {
  exportValue?: (row: TData) => string | number | null | undefined;
  /** Đặt true để bỏ cột khỏi tệp xuất (cột hộp chọn, cột nút thao tác). */
  exportSkip?: boolean;
}

// `ColumnMeta` của TanStack là interface rỗng, cố ý để bên dùng tự khai. Không mở rộng ở
// đây thì `meta: { exportValue }` là lỗi thừa thuộc tính, và tham số `row` thành `any`.
declare module "@tanstack/react-table" {
  // Thân rỗng là đúng ý đồ: declaration merging chỉ cần phần `extends`.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface ColumnMeta<TData extends RowData, TValue> extends ExportableColumnMeta<TData> {}
}

/**
 * Xuất bảng ra CSV mở được bằng Excel.
 *
 * CSV chứ không phải .xlsx: một tệp .xlsx thật cần thêm thư viện vài trăm KB vào bundle,
 * trong khi thứ người dùng cần là mở được bằng Excel — mà CSV có BOM thì mở được.
 */
export function exportTableToCsv<TData>(table: Table<TData>, filename: string): void {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.exportSkip !== true)
    // Chỉ cột có tiêu đề dạng chuỗi: tiêu đề dựng bằng JSX thì không có cách nào biến
    // thành một ô văn bản, và những cột đó (hộp chọn, nút thao tác) cũng không có dữ liệu.
    .filter((column) => typeof column.columnDef.header === "string")
    // Cột nút bấm không có dữ liệu; trước đây xuất ra một cột "Thao tác" rỗng.
    .filter((column) => column.columnDef.header !== "Thao tác" && column.id !== "actions");

  const header = columns.map((column) => String(column.columnDef.header));

  // `getPrePaginationRowModel` chứ không phải `getRowModel`: bảng phân trang 10 hàng mỗi
  // trang, và xuất ra đúng 10 hàng đang nhìn thấy gần như luôn là điều người bấm nút
  // không mong muốn. Sắp xếp và lọc thì vẫn giữ — đó là những thứ họ chủ động chọn.
  const rows = table.getPrePaginationRowModel().rows.map((row) =>
    columns.map((column) => {
      const exportValue = column.columnDef.meta?.exportValue;
      return exportValue ? (exportValue(row.original) ?? "") : exportCell(row.getValue(column.id));
    }),
  );

  // BOM, CRLF, chặn công thức và thời điểm thu hồi blob: một bản duy nhất ở `@codementor/utils`.
  downloadCsvRows(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
}
