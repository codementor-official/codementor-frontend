import type { RowData, Table } from "@tanstack/react-table";

/**
 * Dấu thứ tự byte, thứ nói cho Excel biết tệp là UTF-8.
 *
 * Dựng từ mã ký tự chứ không dán ký tự thật vào chuỗi: U+FEFF vô hình trong trình soạn
 * thảo, và JavaScript coi nó là khoảng trắng — một công cụ trên đường đi đã lược nó đi mà
 * không báo gì. Tệp vẫn tải về được, chỉ là mở bằng Excel thì mọi chữ có dấu thành ký tự
 * lạ: đúng cái mà BOM sinh ra để tránh, và đúng kiểu lỗi không ai thấy khi review.
 */
const BOM = String.fromCharCode(0xfeff);

/** CSV ngắt dòng bằng CRLF. Excel đọc được LF, nhưng vài công cụ cũ thì không. */
const NEWLINE = "\r\n";

/**
 * Ô CSV. Bọc trong nháy kép và nhân đôi nháy kép bên trong — không có ngoại lệ nào cho
 * giá trị "trông có vẻ an toàn": một cái tên chứa dấu phẩy là đủ để lệch toàn bộ cột từ
 * đó trở đi, và lỗi ấy chỉ lộ ra ở đúng những hàng ít ai nhìn.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    .filter((column) => typeof column.columnDef.header === "string");

  const header = columns.map((column) => cell(column.columnDef.header)).join(",");

  // `getPrePaginationRowModel` chứ không phải `getRowModel`: bảng phân trang 10 hàng mỗi
  // trang, và xuất ra đúng 10 hàng đang nhìn thấy gần như luôn là điều người bấm nút
  // không mong muốn. Sắp xếp và lọc thì vẫn giữ — đó là những thứ họ chủ động chọn.
  const rows = table.getPrePaginationRowModel().rows.map((row) =>
    columns
      .map((column) => {
        const exportValue = column.columnDef.meta?.exportValue;
        return cell(exportValue ? exportValue(row.original) : row.getValue(column.id));
      })
      .join(","),
  );

  const blob = new Blob([BOM + [header, ...rows].join(NEWLINE)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  // Không thu hồi ngay: Chrome đọc blob sau khi click trả về, thu hồi sớm thì tệp tải về
  // rỗng. Một nhịp là đủ.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
