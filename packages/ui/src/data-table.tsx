"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Inbox } from "lucide-react";

/** Ticks the header/row checkboxes. Native input so keyboard + indeterminate come free. */
export function TableCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
    />
  );
}

/**
 * Shared TanStack table shell for the group tabs. Deliberately plain: no per-cell
 * chrome, no zebra striping, no column labels repeated inside cells — the header
 * carries the label, the cell carries only the value.
 */
/**
 * Bóng đổ ở mép trái/phải, tự hiện khi còn nội dung và tự biến mất khi đã cuộn hết.
 *
 * Thuần CSS, không cần nghe sự kiện scroll: hai lớp `local` cuộn CÙNG nội dung nên chúng
 * che mất bóng khi ở sát mép, còn hai lớp `scroll` đứng yên so với khung. Nghe sự kiện
 * cuộn sẽ cho kết quả y hệt, đổi lại một listener trên mọi bảng của cả hệ thống.
 *
 * Khai bằng thuộc tính rời chứ không dùng `background` gộp: dạng gộp reset luôn
 * `background-color`, và màu nền của khung đang do lớp `bg-card` cấp.
 */
const SCROLL_SHADOW: CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, var(--card), transparent)",
    "linear-gradient(to left, var(--card), transparent)",
    "radial-gradient(farthest-side at 0 50%, rgb(0 0 0 / 0.2), transparent)",
    "radial-gradient(farthest-side at 100% 50%, rgb(0 0 0 / 0.2), transparent)",
  ].join(", "),
  backgroundPosition: "0 0, 100% 0, 0 0, 100% 0",
  backgroundSize: "36px 100%, 36px 100%, 16px 100%, 16px 100%",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "local, local, scroll, scroll",
};


/**
 * Số dòng vừa đúng chỗ còn lại của màn hình.
 *
 * Trang quản trị nào cũng đứng trong một khung cao đúng bằng cửa sổ (`AdminShell`), nên
 * một `pageSize` cố định là sai ở mọi máy trừ đúng một cỡ màn hình: máy nhỏ thì bảng bị
 * cuộn, máy lớn thì thừa một khoảng trắng bằng nửa trang. Đo khoảng cách từ đỉnh bảng
 * xuống đáy cửa sổ rồi chia cho chiều cao một dòng.
 *
 * `ResizeObserver` trên chính khung bảng chứ không chỉ nghe `resize` của cửa sổ: thu/mở
 * thanh bên, hiện dải lỗi hay đổi bộ lọc đều làm bảng tụt xuống mà cửa sổ không đổi cỡ.
 */
export function useFittedPageSize(ref: RefObject<HTMLElement | null>, fallback = 10): number {
  const [pageSize, setPageSize] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") return;

    const measure = () => {
      const top = element.getBoundingClientRect().top;
      // Trừ phần không phải dòng dữ liệu: hàng tiêu đề, thanh phân trang, lề dưới của
      // vùng cuộn. Đo bằng số vì cả ba đều là hằng số của bộ giao diện này.
      const usable = window.innerHeight - top - HEADER_ROW - PAGINATION_BAR - BOTTOM_GUTTER;
      setPageSize(Math.max(MIN_ROWS, Math.floor(usable / ROW_HEIGHT)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return pageSize;
}

/** Chiều cao một dòng: `py-2.5` hai phía + một dòng chữ `text-sm`. */
const ROW_HEIGHT = 41;
const HEADER_ROW = 37;
const PAGINATION_BAR = 44;
const BOTTOM_GUTTER = 24;
/** Dưới mức này thì bảng thành vô dụng; thà để nó tràn ra ngoài và cuộn. */
const MIN_ROWS = 5;

export function DataTable<TData>({
  table,
  emptyMessage,
  onRowClick,
}: {
  table: TanstackTable<TData>;
  emptyMessage: string;
  /** Row-level navigation; the checkbox cell stops propagation so selection still works. */
  onRowClick?: (row: TData) => void;
}) {
  const rows = table.getRowModel().rows;
  // Bảng rộng hơn khung thì cuộn ngang được, nhưng trên điện thoại không có thanh cuộn
  // nào hiện ra — nhìn vào chỉ thấy cột cuối bị cắt, và người dùng kết luận là hỏng chứ
  // không nghĩ tới việc vuốt. Bóng đổ ở mép là dấu hiệu duy nhất cho biết còn nội dung.
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card" style={SCROLL_SHADOW}>
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                    className="px-3 py-2.5 text-left text-2xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 rounded-sm text-2xs font-bold tracking-wide uppercase hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllLeafColumns().length} className="px-3 py-12 text-center">
                <Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={`border-t border-border ${
                  row.getIsSelected() ? "bg-primary/10" : "hover:bg-muted"
                } ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 align-middle text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Wires the common table options so each tab only declares columns + data.
 *
 * Global filter and row selection are left *uncontrolled* on purpose: hoisting them
 * into the calling component's `useState` made TanStack's auto-reset call the parent
 * setter during render, which React 19 reports as "Can't perform a React state update
 * on a component that hasn't mounted yet". Read them back off the table instead
 * (`table.getState().globalFilter`, `table.getSelectedRowModel()`).
 */
export function useDataTable<TData>({
  data,
  columns,
  getRowId,
  initialSorting = [],
  columnVisibility,
  pageSize = 10,
}: {
  data: TData[];
  // TanStack's own public shape for a heterogeneous column list.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  getRowId: (row: TData) => string;
  initialSorting?: SortingState;
  /** Cột nào ẩn khỏi bảng, theo id. Cột ẩn vẫn nằm trong file xuất CSV — chỗ dùng là
   * những trường dài (email, id) làm chật bảng nhưng lại cần khi mở bằng Excel. */
  columnVisibility?: Record<string, boolean>;
  /** Rows per page. */
  pageSize?: number;
}) {
  return useReactTable({
    data,
    columns,
    initialState: {
      sorting: initialSorting,
      columnVisibility,
      pagination: { pageIndex: 0, pageSize },
    },
    getRowId,
    enableRowSelection: true,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
}

/**
 * Page controls. Hidden entirely on a single page — a pager that can never move is
 * noise. Counts describe filtered rows, not the raw dataset.
 */
export function TablePagination<TData>({ table }: { table: TanstackTable<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  if (table.getPageCount() <= 1) return null;

  const first = pageIndex * pageSize + 1;
  const last = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">
        {first}–{last} trên {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Trang trước"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium text-foreground">
          Trang {pageIndex + 1}/{table.getPageCount()}
        </span>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Trang sau"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Bar above a table: search, filters, then a selection-aware action strip. */
export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  selectedCount,
  onClearSelection,
  bulkActions,
  primaryAction,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: ReactNode;
  selectedCount: number;
  onClearSelection: () => void;
  /** Rendered only while rows are selected. */
  bulkActions?: ReactNode;
  /** Always-visible action on the right, e.g. "Tải tài liệu lên". */
  primaryAction?: ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 min-w-48 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground"
        />
        {filters}
        {primaryAction}
      </div>
      {selectedCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-primary bg-primary/10 px-3 py-2">
          <span className="text-xs font-semibold text-foreground">Đã chọn {selectedCount} mục</span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Bỏ chọn
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">{bulkActions}</div>
        </div>
      )}
    </div>
  );
}
